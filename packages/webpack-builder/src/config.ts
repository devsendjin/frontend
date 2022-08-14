import path from "path";
import { resolvePath } from "./utils";

enum Mode {
  "development" = "development",
  "production" = "production",
}

type SettingsOverride = {
  distributed?: {
    isDistributed: boolean;
    appPublic: string;
    publicUrlOrPath: string;
  };

  // path
  APP_ROOT: string;
  APP_SRC: string;
  APP_PUBLIC: string;
  publicUrlOrPath: string;
  outputPaths: Readonly<Record<"js" | "css" | "images" | "svg", string>>;

  // webpack configs
  alias: Readonly<Record<string, string>>;
  port: number;
  isServerRunning: boolean;

  // other
  MODE: Mode;
  __PROD__: boolean;
  __DEV__: boolean;
};
type ConfigSettings = ReturnType<typeof createSettings>;

const createSettings = (
  settingsOverride?: SettingsOverride
): Omit<SettingsOverride, "distributed"> => {
  const { NODE_ENV, WEBPACK_SERVE, IS_DISTRIBUTED } = process.env;

  const MODE =
    settingsOverride?.MODE ?? NODE_ENV === "production"
      ? Mode.production
      : Mode.development;
  const __PROD__ = settingsOverride?.__PROD__ ?? MODE === Mode.production;
  const __DEV__ = settingsOverride?.__DEV__ ?? !__PROD__;

  const isServerRunning =
    settingsOverride?.isServerRunning ?? WEBPACK_SERVE === "true";
  const isDistributed =
    settingsOverride?.distributed?.isDistributed ?? IS_DISTRIBUTED === "true";

  const APP_ROOT: string =
    settingsOverride?.APP_ROOT ??
    resolvePath({
      foldersToLookup: ["node_modules", "scripts"],
      onLookupFailed: () => {
        throw new Error("APP_ROOT can not be resolved");
      },
    });
  const APP_SRC: string =
    settingsOverride?.APP_SRC ?? path.resolve(APP_ROOT, "src");
  const APP_PUBLIC: string =
    settingsOverride?.APP_PUBLIC ??
    path.resolve(
      APP_ROOT,
      isDistributed && settingsOverride?.distributed?.appPublic
        ? settingsOverride?.distributed?.appPublic
        : "public"
    );

  const publicUrlOrPath: string = settingsOverride?.publicUrlOrPath
    ? isDistributed && settingsOverride?.distributed?.publicUrlOrPath
      ? settingsOverride?.distributed?.publicUrlOrPath
      : "/"
    : "/";

  const outputPaths: SettingsOverride["outputPaths"] = {
    js: "js",
    css: "css",
    images: "images",
    svg: "images/icon",
  };

  // change here + tsconfig.json
  const alias: SettingsOverride["alias"] = {
    "@": APP_SRC,
    "@UI": path.resolve(APP_SRC, "components/UI"),
    "@images": path.resolve(APP_SRC, "assets/images"),
    "@styles": path.resolve(APP_SRC, "assets/styles"),
  };

  return {
    // path
    APP_ROOT,
    APP_SRC,
    APP_PUBLIC,
    publicUrlOrPath,
    outputPaths,

    // webpack configs
    alias,
    port: 4004,
    isServerRunning,

    // other
    MODE,
    __PROD__,
    __DEV__,
  };
};

export type { ConfigSettings, SettingsOverride };
export { createSettings };
