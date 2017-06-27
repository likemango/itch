import { Store } from "redux";
import { Action } from "redux-actions";

import Game from "../db/models/game";
import User from "../db/models/user";
import Collection from "../db/models/collection";
import DownloadKey, { IDownloadKeySummary } from "../db/models/download-key";
import Cave, { ICaveSummary } from "../db/models/cave";

export * from "./tasks";
export * from "../tasks/errors";
import * as Tasks from "./tasks";

export * from "./api";
export * from "../os/runtime";

import { PathScheme } from "../os/paths";

import { SortDirection, SortKey } from "../components/sort-types";

export interface IStore extends Store<IAppState> {}

interface IWatcher {
  addSub(sub: IWatcher): void;
  removeSub(sub: IWatcher): void;
}

export interface IChromeStore extends IStore {
  watcher: IWatcher;
}

export interface IDispatch {
  (a: Action<any>): void;
}

export type Partial<T> = { [P in keyof T]?: T[P] };

export type GameType = "default" | "html" | "download";

export type GameClassification =
  | "game"
  | "tool"
  | "assets"
  | "game_mod"
  | "physical_game"
  | "soundtrack"
  | "other"
  | "comic"
  | "book";

export type GenerosityLevel = "discreet";

export type LaunchType = "native" | "html" | "external" | "shell";

export type ClassificationAction = "launch" | "open";

/**
 * Contains information about a game, retrieved via the itch.io API,
 * and saved to the local database.
 */
export interface IGameRecord {
  /** itch.io-generated unique identifier */
  id: number;

  /** address of the game's page on itch.io */
  url: string;

  /** unique identifier of the developer this game belongs to */
  userId: number;

  /** human-friendly title (may contain any character) */
  title: string;

  /** human-friendly short description */
  shortText: string;

  /** non-GIF cover url */
  stillCoverUrl?: string;

  /** cover url (might be a GIF) */
  coverUrl: string;

  /** downloadable game, html game, etc. */
  type: GameType;

  /** classification: game, tool, comic, etc. */
  classification: GameClassification;

  /** Only present for HTML5 games, otherwise null */
  embed?: IGameEmbedInfo;

  /** True if the game has a demo that can be downloaded for free */
  hasDemo?: boolean;

  /** price of a game, in cents of a dollar */
  minPrice?: number;

  /** current sale, if any */
  sale?: IGameSaleInfo;

  /** as of November 7, 2016, this property doesn't exist yet in the API, but a man can dream.. */
  currency?: string;

  /** if true, this game is downloadable by press users for free */
  inPressSystem?: boolean;

  /** if true, this game accepts money (donations or purchases) */
  canBeBought?: boolean;

  /** date the game was published, or empty/null if not published */
  publishedAt?: string;
}

/**
 * Extended game record for creators / admins of a game
 */
export interface IOwnGameRecord extends IGameRecord {
  /** how many times has the game been downloaded (all time) */
  downloadsCount: number;

  /** how many times has the game been purchased (all time) */
  purchasesCount: number;

  /** how many page views has the game gotten (all time) */
  viewsCount: number;
}

/**
 * This is used in some components, mostly grids/lists that can be filtered
 * using some user-provided query.
 */
export interface IFilteredGameRecord {
  game: Game;
  cave?: ICaveRecord;
  searchScore?: number;
}

/**
 * Sale info
 */
export interface IGameSaleInfo {
  id: number;
  rate: number;
}

/**
 * Presentation information for HTML5 games
 */
export interface IGameEmbedInfo {
  width: number;
  height: number;

  // for itch.io website, whether or not a fullscreen button should be shown
  fullscreen: boolean;
}

export interface IUserRecord {
  /** itch.io-generated unique identifier */
  id: number;

  /** address of the user's profile on itch.io */
  url: string;

  /** human-friendly account name (may contain any character) */
  displayName: string;

  /** used for login, may be changed */
  username: string;

  /** avatar URL, may be gif */
  coverUrl: string;

  /** non-GIF avatar */
  stillCoverUrl?: string;
}

export interface IUserRecordSet {
  [id: string]: User;
}

export interface ICollectionRecord {
  /** itch.io-generated unique identifier */
  id: number;

  /** human-friendly title, may contain any character */
  title: string;

  /** total number of games in collection */
  gamesCount: number;

  /** identifiers of the games in this collection */
  gameIds: number[];

  createdAt: Date;

  updatedAt: Date;
}

export interface IInstallLocationRecord {
  /** UUID or 'default' */
  id: string;

  /** path on disk, null for 'default' (since it's computed) */
  path?: string;
}

export interface ITabDataSet {
  [key: string]: ITabData;
}

export interface ITabParamsSet {
  [key: string]: ITabParams;
}

export interface ITabParams {
  sortBy?: SortKey;
  sortDirection?: SortDirection;
}

export interface ITabPaginationSet {
  [key: string]: ITabPagination;
}

export interface ITabPagination {
  offset?: number;
  limit?: number;
}

export interface IGameRecordSet {
  [id: string]: Game;
}

export interface ICollectionRecordSet {
  [id: string]: Collection;
}

export interface ITabData {
  /** path of tab, something like `collections/:id`, etc. */
  path?: string;

  /** title of web page displayed by tab, if any */
  webTitle?: string;

  /** name of tab as shown in sidebar */
  label?: ILocalizedString;

  /** subtitle shown under label when tab is shown */
  subtitle?: ILocalizedString;

  /** image to show before label when tab is shown */
  image?: string;

  /** do we have enough duplicate image properties already? */
  iconImage?: string;

  /** look ma, more images */
  webFavicon?: string;

  /** special CSS class applied to image shown in tab */
  imageClass?: string;

  /** time at which data for this tab was last fetched */
  timestamp?: number;

  /** games in relation to this tab (single game, games in a collection) */
  games?: IGameRecordSet;

  gamesCount?: number;
  gamesOffset?: number;
  hiddenCount?: number;

  gameIds?: number[];

  downloadKeys?: IDownloadKeysMap;

  /** collections in relation to this tab */
  collections?: ICollectionRecordSet;

  /** users in relation to this tab */
  users?: IUserRecordSet;

  /** error to show for toast tab */
  error?: string;

  /** stack trace to show for toast tab */
  stack?: string;

  /** if this is a web tab, the url of the page we're showing */
  url?: string;

  /** query string associated with tab */
  query?: {
    [key: string]: string;
  };

  /** true if the tab was restored as part of session */
  restored?: boolean;

  lastOffset?: number;
  lastLimit?: number;
}

export interface ITabDataSave extends ITabData {
  id: string;
}

export interface ICaveRecordLocation {
  /* unique GUID generated locally */
  id?: string;

  /** name of the install location: 'default' or a GUID */
  installLocation?: string;

  /** name of the install folder in the install location, derived from the game's title */
  installFolder?: string;

  /** scheme used for computing paths */
  pathScheme: PathScheme;
}

/** Describes an installed item, that can be launched or opened */
export interface ICaveRecord extends ICaveRecordLocation {
  /* unique GUID generated locally */
  id: string;

  /** identifier of itch.io upload currently installed */
  uploadId: number;

  /** uploads related to this cave */
  uploads: {
    [uploadId: string]: IUploadRecord;
  };

  /**
   * identifier of itch.io / wharf build currently installed.
   * if not set, the associated upload wasn't wharf-enabled at the
   * time of the install. if set, there's a good chance we can apply
   * patches instead of fully downloading the new version.
   */
  buildId?: number;

  /** user version for wharf build currently installed */
  buildUserVersion?: string;

  /** channel name of build currently installed */
  channelName?: string;

  /** "modified file time" of archive last installed */
  installedArchiveMtime?: Date;

  /**
     * if true, can be launched — if false, may have not finished
     * installing, may be in the middle of updating, etc.
     */
  launchable?: boolean;

  /** timestamp when that cave was last installed. updates count as install. */
  installedAt?: Date;

  /** timestamp when that cave was last opened/played */
  lastTouched?: Date;

  /** number of seconds played/run, as recorded locally */
  secondsRun?: number;

  /**
     * info on the user that installed the game in this app instance
     */
  installedBy?: {
    /** itch.io user id */
    id: number;

    /** itch.io username at the time it was installed (usernames can change) */
    username: string;
  };

  /** itch.io game id this cave contains */
  gameId: number;

  /** itch.io game info at the time of install */
  game: IGameRecord;

  /** download key what was used to install this game, if any */
  downloadKey: DownloadKey;

  /** true if the upload to install was hand-picked */
  handPicked?: boolean;

  /** if true, cave has been deleted */
  dead?: boolean;

  /** true if the record was created just before installing for the first time */
  fresh?: boolean;

  /** executable files, relative to the game's install folder */
  executables?: string[];

  /** type of launch associated with cave */
  launchType?: LaunchType;

  /** for launchType = html, location of .html file to open */
  gamePath?: string;

  /** for launchType = html, the default window size */
  windowSize?: {
    width: number;
    height: number;
  };

  /** size of installed folder, in bytes */
  installedSize?: number;

  /** set to true if UE4's prereq setup file was successfully run */
  installedUE4Prereq?: boolean;

  /** indexed by prereq name (standard, stored in ibrew-like repo), set to true when installed successfully */
  installedPrereqs?: {
    [prereqName: string]: boolean;
  };
}

export interface ICaveRecordSet {
  [key: string]: ICaveRecord;
}

export type InstallerType =
  | "archive"
  | "air"
  | "dmg"
  | "inno"
  | "nsis"
  | "msi"
  | "naked"
  | "unknown";

export interface IUploadRecord {
  /** numeric identifier generated by itch.io */
  id: number;

  /** name of the uploaded file - null for external uploads */
  filename?: string;

  /** user-friendly name for the upload, set by developer */
  displayName?: string;

  /** if this is a wharf-enabled upload, identifier of the installed build */
  buildId: number;

  /** if this is a wharf-enabled upload, info of the installed build */
  build: IBuildRecord;

  /** if this is a wharf-enabled upload, which channel it corresponds to */
  channelName: string;

  /** set to 'html' for HTML5 games */
  type: string;

  /**
     * the size of this upload, in bytes.
     * for wharf-enabled uploads, it's the latest archive size.
     */
  size?: number;

  /** if true, the upload is a demo and can be downloaded for free */
  demo?: boolean;

  /** when the upload was created */
  createdAt: Date;

  /** when the upload was updated */
  updatedAt: Date;

  pLinux?: boolean;
  pWindows?: boolean;
  pOsx?: boolean;
  pAndroid?: boolean;
}

export interface IBuildRecord {
  /** unique itch.io identifier for build */
  id: number;

  /** itch.io-generated version number */
  version: string;

  /** developer-provided version number */
  userVersion: string;

  /** when the build was last updated */
  updatedAt: string;
}

export type TableName =
  | "caves"
  | "users"
  | "games"
  | "collections"
  | "downloadKeys"
  | "itchAppTabs";

export interface IEntityMap<T> {
  [entityId: string]: T;
}

export interface ITableMap {
  [table: string]: IEntityMap<any>;
}

/**
 * Refers to a bunch of records, for example:
 * { 'apples': ['gala', 'cripps', 'golden'], 'pears': ['anjou'] }
 */
export interface IEntityRefs {
  [table: string]: string[];
}

/**
 * Specifies what to delete from the DB
 */
export interface IDBDeleteSpec {
  entities: IEntityRefs;
}

// see https://itch.io/docs/itch/integrating/manifest.html
export interface IManifestAction {
  /** human-readable or standard name */
  name: string;

  /** file path (relative to manifest), URL, etc. */
  path: string;

  /** icon name (see static/fonts/icomoon/demo.html, don't include `icon-` prefix) */
  icon: string;

  /** command-line arguments */
  args: string[];

  /** sandbox opt-in */
  sandbox?: boolean;

  /** requested API scope */
  scope?: string;

  /** don't redirect stdout/stderr, open in new console window */
  console?: boolean;
}

export interface IManifestPrereq {
  name: string;
}

export interface IManifest {
  actions: IManifestAction[];
  prereqs: IManifestPrereq[];
}

export interface IOwnUserRecord extends IUserRecord {
  /**
     * if set, user owns press account.
     * note to reader: don't bother faking it locally — the server won't let you download
     * anything if you don't actually have a press account. Or maybe you're just looking for
     * fun errors, in which case, go ahead!
     */
  pressUser?: boolean;

  /** if set, user has expressed interest in publishing content on itch.io */
  developer?: boolean;
}

export interface IDownloadKey {
  /** itch.io-generated identifier for the download key */
  id: number;

  /** game the download key is for */
  gameId: number;

  /** date the download key was issued on (often: date purchase was completed) */
  createdAt: Date;
}

export interface ICredentials {
  key: string;
  me: IOwnUserRecord;
}

/**
 * The entire application state, following the redux philosophy
 */
export interface IAppState {
  modals: IModalsState;
  system: ISystemState;
  setup: ISetupState;
  rememberedSessions: IRememberedSessionsState;
  session: ISessionState;
  i18n: II18nState;
  ui: IUIState;
  selfUpdate: ISelfUpdateState;
  preferences: IPreferencesState;
  tasks: ITasksState;
  downloads: IDownloadsState;
  status: IStatusState;
  gameUpdates: IGameUpdatesState;
  queries: IQueriesState;
  /** commonly-needed subset of DB rows available in a compact & performance-friendly format */
  commons: ICommonsState;
}

export interface IQueriesState {
  [key: string]: {
    [key: string]: any[];
  };

  cavesByGameId: {
    [gameId: string]: Cave[];
  };

  downloadKeysByGameId: {
    [gameId: string]: DownloadKey[];
  };
}

export interface ICommonsState {
  downloadKeys: {
    [downloadKeyId: string]: IDownloadKeySummary;
  };
  downloadKeyIdsByGameId: {
    [gameId: string]: string[];
  };
  caves: {
    [caveId: string]: ICaveSummary;
  };
  caveIdsByGameId: {
    [gameId: string]: string[];
  };
  libraryGameIds: string[];
}

export interface IGameCredentials {
  apiKey: string;
  downloadKey?: DownloadKey;
}

export interface IGameUpdate {
  /** which game an update is available for */
  game: Game;

  /** key we used to find uploads, and that should be used for downloads */
  gameCredentials: IGameCredentials;

  /**
     * uploads to pick from (fresher than our last install).
     * will hopefully be often of size 1, but not always
     */
  recentUploads: IUploadRecord[];

  /** true if wharf-enabled upgrade via butler */
  incremental?: boolean;

  /** list of patch entries needed to upgrade to latest via butler */
  upgradePath?: IUpgradePathItem[];
}

export interface IGameUpdatesState {
  /** pending game updates */
  updates: {
    [caveId: string]: IGameUpdate;
  };
}

export type IModalAction = Action<any> | Action<any>[];

export type ModalButtonActionSource = "widget";

export interface IModalButton {
  /** HTML id for this button */
  id?: string;

  /** icomoon icon to use for button */
  icon?: string;

  /** text to show on button */
  label: ILocalizedString;

  /** whether this button directly specifies an action or if it's taken from the widget */
  actionSource?: ModalButtonActionSource;

  /** what should happen when clicking the button */
  action: IModalAction;

  /** use this to specify custom CSS classes (which is both naughty and nice) */
  className?: string;

  /** Tags to tack after label */
  tags?: IModalButtonTag[];
}

export interface IModalButtonTag {
  label: ILocalizedString;
}

export function isModalButton(object: any): object is IModalButton {
  return "label" in object;
}

// FIXME: that's naughty - just make static buttons be constants instead, that works.
export type IModalButtonSpec = IModalButton | "ok" | "cancel";

export interface IModal {
  /** generated identifier for this modal */
  id?: string;

  /** title of the modal */
  title: ILocalizedString;

  /** main body of text */
  message: ILocalizedString;

  /** secondary body of text */
  detail?: ILocalizedString;

  /** an image to show prominently in the modal */
  cover?: string;

  /** main buttons (in list format) */
  bigButtons?: IModalButtonSpec[];

  /** secondary buttons */
  buttons?: IModalButtonSpec[];

  /** name of a custom React component to render below message */
  widget?: string;

  /** parameters to pass to React component */
  widgetParams?: any;

  unclosable?: boolean;
}

export type IModalsState = IModal[];

export interface IItchAppProfile {
  [id: string]: any;
  myGames: IItchAppProfileMyGames;
}

export interface IItchAppProfileMyGames {
  ids: string[];
}

export interface IItchAppTabs {
  /** id of current tab at time of snapshot */
  current: string;

  /** list of transient tabs when the snapshot was taken */
  items: ITabDataSave[];
}

export interface IDownloadKeysMap {
  [id: string]: DownloadKey;
}

export type ProxySource = "os" | "env";

export interface IProxySettings {
  /** if non-null, the proxy specified by the OS (as sniffed by Chromium) */
  proxy?: string;

  /** if non-null, where the proxy settings come from */
  proxySource?: ProxySource;
}

export interface ISystemState {
  /** version string, for example '19.0.0' */
  appVersion: string;

  /** true if running on macOS */
  osx: boolean;
  macos: boolean;

  /** true if running on Windows */
  windows: boolean;

  /** true if running on GNU/Linux */
  linux: boolean;

  /** 2-letter language code sniffed from user's OS */
  sniffedLanguage?: string;

  /** path of ~ */
  homePath: string;

  /** ~/.config/itch, ~/Library/Application Data/itch, %APPDATA%/itch */
  userDataPath: string;

  /** total/free space in various partitions/disks */
  diskInfo: IPartsInfo;

  /** if non-null, the proxy specified by the OS (as sniffed by Chromium) */
  proxy?: string;

  /** if non-null, where the proxy settings come from */
  proxySource?: ProxySource;
}

export interface ISetupOperation {
  message: ILocalizedString;
  icon: string;
  stack?: string;
}

export interface ISetupState {
  done: boolean;
  errors: string[];
  blockingOperation: ISetupOperation;
}

export interface IRememberedSession {
  /** API key */
  key: string;

  /** user info */
  me: IOwnUserRecord;

  /** date the user was last active in the app (this install) */
  lastConnected: number;
}

export interface IRememberedSessionsState {
  [id: string]: IRememberedSession;
}

export interface ISessionState {
  /** collection freshness information */
  cachedCollections: ISessionCachedCollectionsState;
  credentials: ISessionCredentialsState;
  folders: ISessionFoldersState;
  login: ISessionLoginState;
  navigation: ISessionNavigationState;
  search: ISessionSearchState;

  tabData: ITabDataSet;
  tabParams: ITabParamsSet;
  tabPagination: ITabPaginationSet;
}

export interface ISessionCachedCollectionsState {
  /** maps collections to the date they were last fetched */
  fetched: {
    [collectionId: number]: number;
  };
}

export interface ISessionCredentialsState {
  /** API key */
  key: string;

  /** info on user using the app */
  me: IOwnUserRecord;
}

export interface ISessionFoldersState {
  /** path where user-specific data is stored, such as their credentials */
  libraryDir: string;
}

export interface ISessionLoginState {
  /**
     * true if the list of remembered sessions is shown,
     * false if the username/password form is shown.
     */
  picking: boolean;

  errors: string[];
  blockingOperation: ISetupOperation;
}

export interface ITabs {
  /** tabs that can't be closed or re-ordered */
  constant: string[];
  /** tabs that can be moved around/closed */
  transient: string[];
}

export type TabLayout = "grid" | "table";

export interface ISessionNavigationState {
  /** opened tabs */
  tabs: ITabs;

  /** set to true when a tab is loading */
  loadingTabs: {
    [key: string]: boolean;
  };

  /** current page (gate, etc.) */
  page: string;

  /** current tab id */
  id: string;

  /** last constant tab visited */
  lastConstant: string;
}

export interface ISearchResults {
  // TODO: make sane
  gameResults: {
    result: {
      gameIds: string[];
    };
    entities: {
      games?: {
        [id: string]: IGameRecord;
      };
    };
  };

  userResults: {
    result: {
      userIds: string[];
    };
    entities: {
      users?: {
        [id: string]: IUserRecord;
      };
    };
  };
}

export interface ISessionSearchState {
  /** search suggestion */
  example: string;

  /** query typed by user */
  typedQuery: string;

  /** query we're showing results for (lags behind typedQuery) */
  query: string;

  /** whether the search pane is displayed or not */
  open: boolean;

  /** whether we're currently fetching results or not */
  loading: boolean;

  /** search result currently highlighted */
  highlight: number;

  /** current search results for 'query' */
  results: ISearchResults;
}

export interface II18nResources {
  [lang: string]: {
    [key: string]: string;
  };
}

/** Info about a locale. See locales.json for a list that ships with the app. */
export interface ILocaleInfo {
  /** 2-letter language code */
  value: string;

  /** native name of language (English, Français, etc.) */
  label: string;
}

export interface II18nState {
  /** 2-letter code for the language the app is currently displayed in */
  lang: string;

  /** all translated strings */
  strings: II18nResources;

  /** locales we'll download soon */
  queued: {
    [lang: string]: boolean;
  };

  /** locales we're downloading now */
  downloading: {
    [lang: string]: boolean;
  };

  locales: ILocaleInfo[];
}

export interface IUIMenuState {
  template: Electron.MenuItemConstructorOptions[];
}

export interface IUIMainWindowState {
  /** id of the electron BrowserWindow the main window is displayed in */
  id: number;

  /** true if main window has focus */
  focused: boolean;

  /** true if main window is fullscreen */
  fullscreen: boolean;

  /** true if main window is maximized */
  maximized: boolean;
}

export interface IUIState {
  menu: IUIMenuState;
  mainWindow: IUIMainWindowState;
}

export interface ISelfUpdate {
  /** the name of the version, e.g. 19.0.0 */
  name: string;

  /** the date the version was published at */
  pub_date: string;

  /** release notes for the version */
  notes: string;

  /** release page for this version */
  url: string;
}

export interface ISelfUpdateState {
  available?: ISelfUpdate;
  downloading?: ISelfUpdate;
  downloaded?: ISelfUpdate;

  checking: boolean;
  uptodate: boolean;
  error?: string;
}

export interface IInstallLocation {
  /** path on disk (empty for appdata) */
  path: string;

  /** set to true when deleted. still keeping the record around in case some caves still exist with it */
  deleted?: boolean;
}

export interface IPreferencesState {
  /** is the app allowed to check for updates to itself? */
  downloadSelfUpdates?: boolean;

  /** do not make any network requests */
  offlineMode?: boolean;

  installLocations?: {
    [key: string]: IInstallLocation;
  };

  /** where to install games (doesn't change already-installed games) */
  defaultInstallLocation?: string;

  sidebarWidth?: number;

  /** use sandbox */
  isolateApps?: boolean;

  /** when closing window, keep running in tray */
  closeToTray?: boolean;

  /** notify when a download has been installed or updated */
  readyNotification?: boolean;

  /** show the advanced section of settings */
  showAdvanced?: boolean;

  /** language picked by the user */
  lang?: string;

  /** if true, user's already seen the 'minimize to tray' notification */
  gotMinimizeNotification?: boolean;

  /** should the itch app start on os startup? */
  openAtLogin?: boolean;

  /** when the itch app starts at login, should it be hidden? */
  openAsHidden?: boolean;

  /** show consent dialog before applying any game updates */
  manualGameUpdates?: boolean;

  /** prevent display sleep while playing */
  preventDisplaySleep?: boolean;

  /** if rediff'd patch is available, use it instead of original patch */
  preferOptimizedPatches?: boolean;

  /** hide games that aren't compatible with this computer (in native views) */
  onlyCompatibleGames?: boolean;

  /** hide games that weren't purchased or claimed */
  onlyOwnedGames?: boolean;

  /** hide games that aren't currently installed */
  onlyInstalledGames?: boolean;

  /** layout to use to show games */
  layout?: TabLayout;
}

export interface ITask {
  /** generated identifier */
  id: string;

  /** name of the task: install, uninstall, etc. */
  name: string;

  /** progress in the [0, 1] interval */
  progress: number;

  /** id of the game this task is for (which game we're installing, etc.) */
  gameId: number;

  /** bytes per second at which task is being processed, if applicable */
  bps?: number;

  /** estimated time remaining for task, in seconds, if available */
  eta?: number;

  prereqsState?: IPrereqsState;
}

export interface ITasksState {
  /** all tasks currently going on in the app (installs, uninstalls, etc.) */
  tasks: {
    [key: string]: ITask;
  };

  /** same as tasks, grouped by gameId - there may be multiple for the same game */
  tasksByGameId: {
    [gameId: string]: ITask[];
  };

  /** all tasks finished and not cleared yet, since the app started */
  finishedTasks: ITask[];
}

export interface IEnvironment {
  [key: string]: string;
}

export interface IUpgradePathItem {
  id: number;
  userVersion?: string;
  updatedAt: string;
  patchSize: number;
}

/**
 * A download in progress for the app. Always linked to a game,
 * sometimes for first install, sometimes for update.
 */
export interface IDownloadItem extends Tasks.IQueueDownloadOpts {
  /** unique generated id for this download */
  id: string;

  /** reason why this download was started */
  reason: Tasks.DownloadReason;

  /** download progress in a [0, 1] interval */
  progress: number;

  /** set when download has been completed */
  finished?: boolean;

  /** order in the download list: can be negative, for reordering */
  order: number;

  /** at how many bytes per second are we downloading right now? */
  bps?: number;

  /** how many seconds till the download ends? */
  eta?: number;

  /** timestamp the download started at */
  startedAt?: number;

  /** timestamp the download finished at */
  finishedAt?: number;

  /** an error that may have occured while downloading */
  err?: string;

  /** for fresh game installs, where to install it */
  installLocation?: string;
}

export interface IDownloadSpeedDataPoint {
  bps: number;
}

export type IDownloadSpeeds = IDownloadSpeedDataPoint[];

export interface IDownloadsState {
  /** All the downloads we know about, indexed by their own id */
  items: {
    [id: string]: IDownloadItem;
  };

  /** IDs of all the downloads we know about, grouped by the id of the game they're associated to */
  itemIdsByGameId: {
    [gameId: string]: string[];
  };

  /** true if downloads are currently paused */
  paused: boolean;

  /** Download speeds, in bps, each item represents one second */
  speeds: IDownloadSpeeds;
}

export type OpenAtLoginErrorCause = "no_desktop_file" | "error";

/**
 * Something went wrong when applying
 */
export interface IOpenAtLoginError {
  /** why did applying the setting failed */
  cause: OpenAtLoginErrorCause;

  /** if cause is `error`, this is an error message */
  message?: string;
}

export interface IStatusState {
  messages: ILocalizedString[];
  /** app easter eggs, enabled throughout some periods */
  bonuses: {};
  openAtLoginError: IOpenAtLoginError;
}

// i18n

/**
 * Localized messages can be just a string, or an Array arranged like so:
 * [key: string, params: {[name: string]: string}]
 */
export type ILocalizedString = string | any[];

// diskinfo

export interface ISpaceInfo {
  free: number;
  size: number;
}

export interface IPartInfo extends ISpaceInfo {
  letter?: string;
  mountpoint?: string;
}

/**
 * Contains information about the size and free space
 * of all the partitions / disks of this computer.
 */
export interface IPartsInfo {
  parts: IPartInfo[];
  total: ISpaceInfo;
}

export interface IProgressInfo {
  /** progress of the task between [0,1] */
  progress: number;

  /** current bytes per second */
  bps?: number;

  /** estimated time remaining, in seconds */
  eta?: number;

  prereqsState?: IPrereqsState;
}

export interface IProgressListener {
  (info: IProgressInfo): void;
}

export interface IPrereqsState {
  tasks: {
    [key: string]: ITaskProgressState;
  };
}

export interface ITaskProgressState {
  name: string;
  order: number;
  status: TaskProgressStatus;
  progress: number;
  eta: number;
  bps: number;
}

export type TaskProgressStatus =
  | "downloading"
  | "extracting"
  | "ready"
  | "installing"
  | "done";

export interface IRedistInfo {
  /** Human-friendly name for redist, e.g. "Microsoft Visual C++ 2010 Redistributable" */
  fullName: string;

  /** The exact version provided */
  version: string;

  /** Architecture of the redist */
  arch: "386" | "amd64";

  /** Executable to launch (in .7z archive) */
  command: string;

  /** Arguments to give to executable on launch - aim for quiet/unattended/no reboots */
  args: string[];

  /** Should the executable be run as admin? */
  elevate?: boolean;

  /** Registry keys we can check to see if installed */
  registryKeys?: string[];

  /** List of DLLs to check for, to make sure it's installed */
  dlls?: string[];

  /** Meaning of some exit codes */
  exitCodes?: IRedistExitCode[];
}

export interface IRedistExitCode {
  code: number;
  success?: boolean;
  message?: string;
}

export type ExeArch = "386" | "amd64";

export type ItchPlatform = "osx" | "windows" | "linux" | "unknown";

export interface IRuntime {
  platform: ItchPlatform;
  is64: boolean;
}
