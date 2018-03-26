import { goos, goarch } from "./platform";
import { request } from "../net/request/metal-request";
import * as querystring from "querystring";
import urls from "../constants/urls";
import * as sf from "../os/sf";

import rootLogger, { Logger } from "../logger";
import { IStore, IPackageState, IProgressInfo } from "../types";
import { join } from "path";
import { readdir, mkdirp } from "../os/sf";
import formulas, { FormulaSpec } from "./formulas";
import { downloadToFile } from "../net";
import { actions } from "../actions";
import { unzip } from "./unzip";

import * as semver from "semver";
import { SemVer } from "semver";
import { rest, isEmpty } from "underscore";
import { delay } from "../reactors/delay";

const forceHead = true;
const semVerHead = semver.coerce("9999.0.0");
const sanityCheckTimeout = 10000;
const platform = `${goos()}-${goarch()}`;

const downloadStart = 0.0;
const downloadWeight = 0.3;

const extractStart = downloadStart + downloadWeight;
const extractWeight = 0.3;

export class Package {
  private store: IStore;
  private formula: FormulaSpec;
  private prefix: string;
  private name: string;
  private baseURL: string;
  private logger: Logger;

  constructor(store: IStore, prefix: string, name: string) {
    this.store = store;
    this.prefix = prefix;
    this.name = name;
    this.formula = formulas[name];
    if (!this.formula) {
      throw new Error(`No spec for formula: ${this.name}`);
    }
    this.baseURL = `${urls.brothRepo}/${name}/${platform}`;
    this.logger = rootLogger.child({ name: `broth :: ${name}` });
    this.stage("idle");
  }

  buildURL(path: string, queryParams?: { [key: string]: any }): string {
    const cleanPath = path.replace(/^\//, "");
    let query = "";
    if (queryParams) {
      query = "?" + querystring.stringify(queryParams);
    }
    return `${this.baseURL}/${cleanPath}${query}`;
  }

  buildDownloadURL(version: SemVer, path: string) {
    const cleanPath = path.replace(/^\//, "");
    const remoteVersionFolder = semver.eq(version, semVerHead)
      ? "head"
      : `v${version.format()}`;
    return this.buildURL(`/${remoteVersionFolder}/${cleanPath}`);
  }

  /** fetch latest version number from repo */
  async getLatestVersion(): Promise<SemVer> {
    if (forceHead) {
      return semVerHead;
    }

    const url = this.buildURL(`/LATEST`, { t: Date.now() });
    const res = await request("get", url, {});
    if (res.statusCode !== 200) {
      throw new Error(`got HTTP ${res.statusCode} while fetching ${url}`);
    }

    const versionString = res.body.toString("utf8").trim();
    return semver.coerce(versionString);
  }

  getName(): string {
    return this.name;
  }

  getVersionsDir(): string {
    return join(this.prefix, this.name, "versions");
  }

  getDownloadsDir(): string {
    return join(this.prefix, this.name, "downloads");
  }

  getVersionPrefix(version: SemVer): string {
    return join(this.getVersionsDir(), version.format());
  }

  getInstalledMarkerPath(version: SemVer): string {
    return join(this.getVersionPrefix(version), ".installed");
  }

  info(msg: string) {
    this.logger.info(msg);
  }

  warn(msg: string) {
    this.logger.warn(msg);
  }

  debug(msg: string) {
    this.logger.debug(msg);
  }

  async ensure() {
    await mkdirp(this.getVersionsDir());
    const validVersions = await this.getValidVersions();
    if (isEmpty(validVersions)) {
      this.info(`No valid versions installed`);
      await this.upgrade();
    } else {
      await this.cleanOldVersions();
      this.refreshPrefix(validVersions[0]);
    }
  }

  getCurrentVersionPrefix(): string {
    return this.store.getState().broth.packages[this.name].versionPrefix;
  }

  refreshPrefix(version: SemVer) {
    const newVersionPrefix = this.getVersionPrefix(version);
    const oldVersionPrefix = this.getCurrentVersionPrefix();

    if (newVersionPrefix !== oldVersionPrefix) {
      this.info(`Switching to ${version}`);
      this.store.dispatch(
        actions.packageGotVersionPrefix({
          name: this.name,
          version: version.format(),
          versionPrefix: newVersionPrefix,
        })
      );
    }
  }

  upgradeLock = false;
  async upgrade() {
    if (this.upgradeLock) {
      throw new Error(`package ${this.name} locked`);
    }
    try {
      this.upgradeLock = true;
      this.stage("assess");
      await this.doUpgrade();
    } finally {
      this.upgradeLock = false;
      this.stage("idle");

      try {
        await sf.wipe(this.getDownloadsDir());
      } catch (e) {}
    }
  }

  private stage(stage: IPackageState["stage"]) {
    this.store.dispatch(actions.packageStage({ name: this.name, stage }));
  }

  private emitProgress(progressInfo: IProgressInfo) {
    this.logger.info(`${(progressInfo.progress * 100).toFixed(1)}% done...`);
    this.store.dispatch(
      actions.packageProgress({ name: this.name, progressInfo })
    );
    this.store.dispatch(
      actions.setupOperationProgress({ progress: progressInfo })
    );
  }

  private async doUpgrade() {
    let latestVersion: SemVer;
    try {
      latestVersion = await this.getLatestVersion();
    } catch (e) {
      this.logger.warn(`While checking for latest version: ${e.stack}`);
      throw new Error(
        `Could not retrieve latest version of ${this.name}: ${e.message}`
      );
    }
    this.info(`Latest is ${latestVersion}`);

    if (
      this.getVersionPrefix(latestVersion) === this.getCurrentVersionPrefix()
    ) {
      this.info(`Already the active version, nothing to do`);
    }

    if (await this.isVersionValid(latestVersion)) {
      // do nothing
    } else {
      this.store.dispatch(
        actions.setupStatus({
          icon: "install",
          message: ["login.status.finalizing_installation"],
        })
      );

      const archiveName = `${this.name}.zip`;
      const archiveUrl = this.buildDownloadURL(
        latestVersion,
        `/${archiveName}`
      );

      await sf.wipe(this.getDownloadsDir());
      const archivePath = join(this.getDownloadsDir(), archiveName);

      this.stage("download");
      this.info(`Downloading ${this.name}@${latestVersion}`);
      this.info(`...from ${archiveUrl}`);
      this.info(`...to ${archivePath}`);

      await downloadToFile(
        info => {
          let newInfo = {
            ...info,
            progress: downloadStart + info.progress * downloadWeight,
          };
          this.emitProgress(newInfo);
        },
        this.logger,
        archiveUrl,
        archivePath
      );

      this.stage("install");
      this.info(`Extracting...`);

      const versionPrefix = this.getVersionPrefix(latestVersion);
      await sf.wipe(versionPrefix);
      await unzip({
        archivePath,
        destination: versionPrefix,
        logger: this.logger,
        onProgress: info => {
          let newInfo = {
            ...info,
            progress: extractStart + info.progress * extractWeight,
          };
          this.emitProgress(newInfo);
        },
      });
      await this.writeInstallMarker(latestVersion);

      this.info(`Validating...`);
      if (!await this.isVersionValid(latestVersion)) {
        throw new Error(
          `Could not validate version ${latestVersion} of ${this.name}`
        );
      }
    }

    this.info(`Validated!`);
    await this.cleanOldVersions();
    this.refreshPrefix(latestVersion);
  }

  async hasInstallMarker(version: SemVer): Promise<boolean> {
    const installedMarkerPath = this.getInstalledMarkerPath(version);
    try {
      await sf.readFile(installedMarkerPath, { encoding: "utf8" });
      return true;
    } catch (e) {}

    return false;
  }

  async writeInstallMarker(version: SemVer) {
    const installedMarkerPath = this.getInstalledMarkerPath(version);
    await sf.writeFile(installedMarkerPath, `installed on ${new Date()}`, {
      encoding: "utf8",
    });
  }

  async cleanOldVersions() {
    const validVersions = await this.getValidVersions();
    const obsoleteVersions = rest(validVersions, 2);
    if (isEmpty(obsoleteVersions)) {
      return;
    }

    for (const ov of obsoleteVersions) {
      this.info(`Removing obsolete version ${ov.format()}`);
      try {
        await sf.wipe(this.getVersionPrefix(ov));
      } catch (e) {
        this.warn(`Could not remove version ${ov.format()}: ${e}`);
      }
    }
  }

  async getValidVersions(): Promise<SemVer[]> {
    const presentVersions = await this.getPresentVersions();

    let validVersions: SemVer[] = [];
    for (const v of presentVersions) {
      if (await this.isVersionValid(v)) {
        validVersions.push(v);
      }
    }

    validVersions = validVersions.sort(semver.compare).reverse();
    this.debug(`Valid versions: ${validVersions.join(", ")}`);
    return validVersions;
  }

  async getPresentVersions(): Promise<SemVer[]> {
    let presentVersions: SemVer[] = [];
    let subdirs = await readdir(this.getVersionsDir());
    for (const subdir of subdirs) {
      const version = semver.coerce(subdir);
      if (!version) {
        this.warn(`Ignoring subdir ${subdir}: could not coerce to semver`);
        continue;
      }

      if (await this.hasInstallMarker(version)) {
        presentVersions.push(version);
      }
    }

    presentVersions = presentVersions.sort(semver.compare).reverse();
    this.debug(`Present versions: ${presentVersions.join(", ")}`);
    return presentVersions;
  }

  async isVersionValid(v: SemVer): Promise<boolean> {
    try {
      await Promise.race([
        this.formula.sanityCheck(this.getVersionPrefix(v)),
        (async () => {
          await delay(sanityCheckTimeout);
          throw new Error("timed out");
        })(),
      ]);
    } catch (e) {
      this.warn(`Sanity check failed: ${e.message}`);
      return false;
    }

    return true;
  }
}
