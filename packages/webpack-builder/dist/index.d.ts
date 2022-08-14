import webpack, { Configuration } from 'webpack';

declare enum Mode {
    "development" = "development",
    "production" = "production"
}
declare type SettingsOverride = {
    distributed?: {
        isDistributed: boolean;
        appPublic: string;
        publicUrlOrPath: string;
    };
    APP_ROOT: string;
    APP_SRC: string;
    APP_PUBLIC: string;
    publicUrlOrPath: string;
    outputPaths: Readonly<Record<"js" | "css" | "images" | "svg", string>>;
    alias: Readonly<Record<string, string>>;
    port: number;
    isServerRunning: boolean;
    MODE: Mode;
    __PROD__: boolean;
    __DEV__: boolean;
};
declare type ConfigSettings = ReturnType<typeof createSettings>;
declare const createSettings: (settingsOverride?: SettingsOverride) => Omit<SettingsOverride, "distributed">;

declare type ResolvePath = (params: {
    foldersToLookup: string[];
    onLookupSuccess?: (resolvedPath: string) => string;
    onLookupFailed?: () => string;
    recursionMaxLevel?: number;
}) => string;
declare const resolvePath: ResolvePath;

declare class WebpackConfig {
    private settings;
    private config;
    constructor();
    setupSettings(updater: (defaultSettings: ConfigSettings) => SettingsOverride): this;
    logWebpack(callback: (wp: typeof webpack) => void): this;
    build(updateConfig?: (config: Configuration) => Configuration): Configuration;
}

export { WebpackConfig, resolvePath };
