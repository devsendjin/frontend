import { createSettings, ConfigSettings, SettingsOverride } from "./config";
import { createWebpackConfig } from "./webpack-config";
import { Configuration } from "./types";
import webpack from "webpack";

class WebpackConfig {
  private settings: ConfigSettings;
  private config: Configuration = {};

  constructor() {
    this.settings = createSettings();
  }

  // public logSetup(
  //   logger?: (settings: ConfigSettings, webpackConfig: Configuration) => void
  // ) {
  //   if (logger) {
  //     logger(this.settings, this.config);
  //   } else {
  //     console.log("settings: ", this.settings);
  //     console.log("webpack config: ", this.config);
  //   }
  //   return this;
  // }

  public setupSettings(
    updater: (defaultSettings: ConfigSettings) => SettingsOverride
  ): this {
    this.settings = updater(this.settings);
    return this;
  }

  public logWebpack(callback: (wp: typeof webpack) => void): this {
    callback?.(webpack);
    return this;
  }

  public build(
    updateConfig?: (config: Configuration) => Configuration
  ): Configuration {
    this.config = createWebpackConfig(this.settings);

    if (updateConfig) {
      this.config = updateConfig(this.config);
    }

    return this.config;
  }
}

export { resolvePath } from "./utils";
export { WebpackConfig };
