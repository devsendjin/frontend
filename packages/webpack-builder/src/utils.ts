import path from "path";
import fs from "fs";

import webpack, { RuleSetUseItem } from "webpack";
import autoprefixer from "autoprefixer";
import postcssFlexbugsFixes from "postcss-flexbugs-fixes";
import Sass from "sass";
import Postcss from "postcss";
// plugins
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CircularDependencyPlugin from "circular-dependency-plugin";
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";

import { ConfigSettings } from "./config";
import { WebpackPlugin } from "./types";

type ResolvePath = (params: {
  foldersToLookup: string[];
  onLookupSuccess?: (resolvedPath: string) => string;
  onLookupFailed?: () => string;
  recursionMaxLevel?: number;
}) => string;
const resolvePath: ResolvePath = ({
  foldersToLookup,
  onLookupSuccess,
  onLookupFailed,
  recursionMaxLevel = 10,
}) => {
  let directories: string[] = [];
  let directoryDepth = 0;
  let pathToLookup = "./";

  const readDir = () => {
    // guard against recursion
    if (directoryDepth >= recursionMaxLevel) {
      if (onLookupFailed) {
        pathToLookup = onLookupFailed();
        return;
      } else {
        throw Error(
          `Can't resolve directory. directoryDepth = ${directoryDepth}`
        );
      }
    }

    directoryDepth++;

    try {
      directories = fs.readdirSync(pathToLookup, { encoding: "utf-8" });

      if (
        !directories.some((directory) =>
          foldersToLookup.some((folderToLookup) => folderToLookup === directory)
        )
      ) {
        pathToLookup = pathToLookup.concat("../");
        readDir();
      }
    } catch (e) {
      console.error("Error occurred during dir reading: ", e);
      process.exit(0);
    }
  };
  readDir();

  const resolvedPath = path.resolve(pathToLookup);

  if (onLookupSuccess) {
    return onLookupSuccess(resolvedPath);
  }

  return resolvedPath;
};

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export const isObject = (item: any) => {
  return item && typeof item === "object" && !Array.isArray(item);
};

// type TMergedObject = { [key: string]: any };
// /**
//  * Deep merge two objects.
//  * @param target
//  * @param ...sources
//  */
// const mergeDeep = (
//   target: TMergedObject,
//   ...sources: Array<TMergedObject>
// ): any => {
//   if (!sources.length) return target;
//   const source = sources.shift();

//   if (isObject(target) && isObject(source)) {
//     for (const key in source) {
//       if (isObject(source[key])) {
//         if (!target[key]) Object.assign(target, { [key]: {} });
//         mergeDeep(target[key], source[key]);
//       } else {
//         Object.assign(target, {
//           // [key]: typeof source[key] === 'string' ? [target[key], source[key]].join(' ') : source[key], // with strings concatenated
//           [key]: source[key],
//         });
//       }
//     }
//   }
//   return mergeDeep(target, ...sources);
// };

type GetLoadersReturn<TRuleSetUseItem = RuleSetUseItem> = {
  postCss: () => TRuleSetUseItem;
  sass: () => TRuleSetUseItem;
  css: () => TRuleSetUseItem;
  cssModules: () => TRuleSetUseItem;
  styleOrExtractCss: () => TRuleSetUseItem;
};
type GetLoaders = (config: ConfigSettings) => GetLoadersReturn;
const getLoaders: GetLoaders = (config) => {
  return {
    // if any postcss error happens
    // https://github.com/postcss/postcss/wiki/PostCSS-8-for-end-users
    postCss: () => ({
      loader: "postcss-loader",
      options: {
        implementation: Postcss,
        postcssOptions: {
          plugins: [
            ["postcss-preset-env", { stage: 4 }],
            postcssFlexbugsFixes,
            autoprefixer,
          ],
        },
      },
    }),
    sass: () => ({
      loader: "sass-loader",
      options: {
        sourceMap: config.__DEV__,
        implementation: Sass,
        additionalData: `
          @import "src/assets/styles/abstracts/_index.scss";
        `,
        sassOptions: {
          includePaths: [
            path.join(config.APP_SRC, "assets/styles/abstracts/**/*.scss"),
          ],
        },
      },
    }),
    css: () => ({
      loader: "css-loader",
      options: {
        sourceMap: config.__DEV__,
        importLoaders: 2,
      },
    }),
    cssModules: () => ({
      loader: "css-loader",
      options: {
        importLoaders: 2,
        esModule: true,
        modules: {
          localIdentName: config.__DEV__
            ? "[local]--[folder]--[hash:base64:3]"
            : "[hash:base64:6]",
        },
        sourceMap: config.__DEV__,
      },
    }),
    styleOrExtractCss: () =>
      config.isServerRunning
        ? { loader: "style-loader" }
        : MiniCssExtractPlugin.loader,
  };
};

type PluginsMap = Readonly<{
  DefinePlugin: WebpackPlugin;
  CircularDependencyPlugin: WebpackPlugin;
  HtmlWebpackPlugin: WebpackPlugin;
  ReactRefreshWebpackPlugin: WebpackPlugin;
  MiniCssExtractPlugin: WebpackPlugin;
}>;

const getPlugins = (settings: ConfigSettings) => {
  const pluginsMap: PluginsMap = {
    DefinePlugin: new webpack.DefinePlugin({
      __DEV__: settings.__DEV__,
      __PROD__: settings.__PROD__,
    }),
    CircularDependencyPlugin: new CircularDependencyPlugin({
      exclude: /node_modules/, // exclude detection of files based on a RegExp
      include: /react-hook-form/, // include specific files based on a RegExp
      failOnError: true, // add errors to webpack instead of warnings
      cwd: settings.APP_ROOT, // set the current working directory for displaying module paths
      // allow import cycles that include an asyncronous import,
      // e.g. via import(/* webpackMode: "weak" */ './file.js')
      allowAsyncCycles: false,
    }),
    HtmlWebpackPlugin: new HtmlWebpackPlugin({
      template: path.join(settings.APP_SRC, "index.pug"),
      filename: path.join(settings.APP_PUBLIC, "index.html"),
      inject: "body",
      minify: settings.__PROD__,
    }),
    ReactRefreshWebpackPlugin: new ReactRefreshWebpackPlugin({
      overlay: false,
    }),
    MiniCssExtractPlugin: new MiniCssExtractPlugin({
      filename: `${settings.outputPaths.css}/[contenthash].css`,
    }),
  };

  const plugins = [
    pluginsMap["DefinePlugin"],
    pluginsMap["CircularDependencyPlugin"],
    pluginsMap["HtmlWebpackPlugin"],
  ];

  if (settings.isServerRunning) {
    plugins.push(pluginsMap["ReactRefreshWebpackPlugin"]);
  }

  if (settings.__PROD__ || (settings.__DEV__ && !settings.isServerRunning)) {
    plugins.push(pluginsMap["MiniCssExtractPlugin"]);
  }
  return plugins;
};

export { resolvePath, getLoaders, getPlugins };
