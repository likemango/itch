import urlParser from "./url";
import * as querystring from "querystring";

import staticTabData from "../constants/static-tab-data";

import { IGame } from "../db/models/game";
import { IUser } from "../db/models/user";
import { ICollection } from "../db/models/collection";

import { IInstallLocation, ITabData } from "../types";

import getByIds from "../helpers/get-by-ids";
import { first } from "underscore";

const ITCH_HOST_RE = /^([^.]+)\.(itch\.io|localhost\.com:8080)$/;

export async function transformUrl(original: string): Promise<string> {
  if (/^about:/.test(original)) {
    return original;
  }

  let req = original;
  const searchUrl = (q: string) => {
    return "https://duckduckgo.com/?" + querystring.stringify({ q, kae: "d" });
  };

  // special search URLs
  if (/^\?/.test(original)) {
    return searchUrl(original.substr(1));
  }

  // spaces and no dots ? smells like a search request
  if (original.indexOf(" ") !== -1 && original.indexOf(".") === -1) {
    return searchUrl(original);
  }

  // add http: if needed
  let parsed = urlParser.parse(req);
  if (!parsed.hostname || !parsed.protocol) {
    req = "http://" + original;
    parsed = urlParser.parse(req);
    if (!parsed.hostname) {
      return searchUrl(original);
    }
  }

  return req;
}

export function pathToId(path: string): string {
  const slashIndex = path.indexOf("/");
  if (slashIndex >= 0) {
    const sub = path.substring(slashIndex + 1);
    const questionIndex = sub.lastIndexOf("?");
    if (questionIndex === -1) {
      return sub;
    }
    return sub.substring(0, questionIndex);
  }
  return "";
}

export function pathSuffix(path: string): string {
  const slashIndex = path.indexOf("/");
  if (slashIndex >= 0) {
    return path.substring(slashIndex + 1);
  }
  return "";
}

export function pathPrefix(path: string): string {
  const slashIndex = path.indexOf("/");
  if (slashIndex >= 0) {
    return path.substring(0, slashIndex);
  }
  return "";
}

export function pathQuery(path: string): string {
  const slashIndex = path.indexOf("/");
  if (slashIndex >= 0) {
    const questionIndex = path.indexOf("?", slashIndex);
    if (questionIndex >= 0) {
      return path.substring(questionIndex + 1);
    }
  }
  return "";
}

export function pathToIcon(path: string) {
  if (path === "featured") {
    return "itchio";
  }
  if (path === "dashboard") {
    return "rocket";
  }
  if (path === "library") {
    return "heart-filled";
  }
  if (path === "preferences") {
    return "cog";
  }
  if (path === "downloads") {
    return "download";
  }
  if (/^collections/.test(path)) {
    return "video_collection";
  }
  if (/^games/.test(path)) {
    return "star";
  }
  if (/^users/.test(path)) {
    return "t-shirt";
  }
  if (/^search/.test(path)) {
    return "search";
  }
  if (/^locations/.test(path)) {
    return "folder";
  }
  if (/^new/.test(path)) {
    return "star2";
  }
  return "earth";
}

export function gameToTabData(game: IGame): ITabData {
  return {
    games: {
      [game.id]: game,
    },
    label: game.title,
    subtitle: game.shortText,
    image: game.stillCoverUrl || game.coverUrl,
    imageClass: "game",
    iconImage: game.stillCoverUrl || game.coverUrl,
  };
}

export function userToTabData(user: IUser): ITabData {
  return {
    users: {
      [user.id]: user,
    },
    label: user.displayName || user.username,
    subtitle: "",
    image: user.stillCoverUrl || user.coverUrl,
    imageClass: "user",
    iconImage: user.stillCoverUrl || user.coverUrl,
  };
}

export function collectionToTabData(collection: ICollection) {
  return {
    collections: {
      [collection.id]: collection,
    },
    label: collection.title,
    subtitle: [
      "sidebar.collection.subtitle",
      { itemCount: collection.gamesCount },
    ],
  };
}

export function locationToTabData(location: IInstallLocation) {
  return {
    label: location.path,
  };
}

export function makeLabel(id: string, data: ITabData) {
  const staticData = staticTabData[id];
  if (staticData) {
    return staticData.label;
  }

  if (data) {
    if (data.path) {
      const prefix = pathPrefix(data.path);
      switch (prefix) {
        case "games": {
          const game = getGame(data);
          if (game) {
            return game.title;
          }
        }
        case "users": {
          const user = getUser(data);
          if (user) {
            return user.displayName || user.username;
          }
        }
        case "collections": {
          const collection = getCollection(data);
          if (collection) {
            return collection.title;
          }
        }
      }
    }

    if (data.webTitle) {
      return data.webTitle;
    }

    if (data.label) {
      return data.label;
    }
  }

  return ["sidebar.loading"];
}

export function isAppSupported(url: string) {
  const { host, pathname } = urlParser.parse(url);

  if (ITCH_HOST_RE.test(host)) {
    const pathItems = pathname.split("/");
    if (pathItems.length === 2) {
      if (pathItems[1].length > 0) {
        // xxx.itch.io/yyy
        return "game";
      } else {
        // xxx.itch.io
        return "user";
      }
    }
  }

  return null;
}

export function getGame(tabData: ITabData): IGame {
  const { path, games } = tabData;
  if (!(path && games)) {
    return null;
  }
  return games[pathToId(path)];
}

export function getUser(tabData: ITabData): IUser {
  const { path, users } = tabData;
  if (!(path && users)) {
    return null;
  }
  return users[pathToId(path)];
}

export function getCollection(tabData: ITabData): ICollection {
  const { path, collections } = tabData;
  if (!(path && collections)) {
    return null;
  }
  return collections[pathToId(path)];
}

export default {
  transformUrl,
  pathToId,
  pathPrefix,
  pathQuery,
  pathToIcon,
  gameToTabData,
  collectionToTabData,
  isAppSupported,
};
