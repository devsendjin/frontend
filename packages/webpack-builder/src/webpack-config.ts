import path from "path";
import TerserPlugin from "terser-webpack-plugin";
import CssMinimizerPlugin from "css-minimizer-webpack-plugin";

import { ConfigSettings } from "./config";
import { getLoaders, getPlugins } from "./utils";
import { Configuration, DevServerConfiguration } from "./types";

const createWebpackConfig = (
  settings: ConfigSettings
): Configuration & { devServer: DevServerConfiguration } => {
  const loaders = getLoaders(settings);
  const plugins = getPlugins(settings);

  return {
    mode: settings.MODE,

    entry: {
      [`${settings.outputPaths.js}/`]: path.join(settings.APP_SRC, "index.tsx"),
    },

    output: {
      filename: "[name][contenthash].js",
      path: settings.APP_PUBLIC,
      chunkFilename: "[id].[chunkhash].js",
      publicPath: settings.publicUrlOrPath,
    },

    resolve: {
      extensions: [
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".css",
        ".sass",
        ".scss",
        ".json",
      ],
      alias: settings.alias,
    },

    target: "web",

    devtool: settings.__DEV__ ? "eval-cheap-module-source-map" : false,

    devServer: settings.__DEV__
      ? {
          static: {
            directory: path.join(settings.APP_ROOT, "public"),
          },
          client: {
            logging: "none",
            overlay: false,
          },
          compress: true,
          hot: settings.isServerRunning, // instead webpack.HotModuleReplacementPlugin
          port: settings.port,
          historyApiFallback: true,
          devMiddleware: {
            writeToDisk: false,
          },
        }
      : {},

    stats:
      settings.__DEV__ || settings.isServerRunning
        ? "errors-warnings"
        : "detailed", // none | detailed | verbose

    ignoreWarnings: [
      {
        message: /color-adjust/, // ignore deprecated css function (appears in bootstrap)
      },
    ],

    optimization: settings.__PROD__
      ? {
          nodeEnv: settings.MODE,
          minimize: true,
          minimizer: [
            new CssMinimizerPlugin({
              minimizerOptions: {
                preset: [
                  "default",
                  {
                    discardComments: {
                      removeAll: true,
                    },
                  },
                ],
              },
            }),
            new TerserPlugin({
              exclude: /node_modules/,
              extractComments: false,
              terserOptions: {
                parse: {
                  html5_comments: false,
                },
                mangle: true,
                sourceMap: false,
                compress: {
                  defaults: true,
                  drop_console: false, // false by default. Pass true to discard calls to console.* functions.
                  keep_infinity: true, // false by default. Pass true to prevent Infinity from being compressed into 1/0, which may cause performance issues on Chrome.
                  passes: 2, // 1 by default. The maximum number of times to run compress.
                },
                format: {
                  comments: false, // "some" by default
                  preamble: "", // null by default. When passed it must be a string and it will be prepended to the output literally. The source map will adjust for this text. Can be used to insert a comment containing licensing information, for example.
                  quote_style: 3, // 0 by default. 3 - always use the original quotes.
                  preserve_annotations: false, // false by default.
                  ecma: 2020, // 5 by default. Desired EcmaScript standard version for output.
                },
                ecma: 2020, // 5 by default. Desired EcmaScript standard version for output.
                keep_classnames: false, // undefined by default.
                keep_fnames: false, // false by default.
                safari10: false, // false by default.
              },
            }),
          ],
        }
      : {},

    module: {
      rules: [
        // ts|tsx
        {
          test: /\.ts(x?)$/i,
          exclude: /node_modules/,
          use: ["babel-loader", "ts-loader"],
        },
        // jsx
        {
          test: /\.jsx$/i,
          exclude: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                presets: ["@babel/preset-react"],
              },
            },
          ],
        },
        // js
        {
          test: /\.js$/i,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        // sass modules
        {
          test: /\.module\.s[ac]ss$/i,
          use: [
            loaders.styleOrExtractCss(),
            loaders.cssModules(),
            loaders.postCss(),
            loaders.sass(),
          ],
        },
        // sass files
        {
          test: /\.s[ac]ss$/i,
          exclude: /\.module\.s[ac]ss$/i,
          use: [
            loaders.styleOrExtractCss(),
            loaders.css(),
            loaders.postCss(),
            loaders.sass(),
          ],
        },
        // css modules
        {
          test: /\.module\.css$/i,
          use: [
            loaders.styleOrExtractCss(),
            loaders.cssModules(),
            loaders.postCss(),
          ],
        },
        // css files
        {
          test: /\.css$/i,
          use: [loaders.styleOrExtractCss(), loaders.css(), loaders.postCss()],
          exclude: /\.module\.css$/i,
        },
        // images
        {
          test: /\.(avif|webp|png|jpe?g|gif)$/i,
          exclude: /\.(svg|eot|ttf|woff|woff2)$/,
          use: [
            {
              loader: "file-loader",
              options: {
                outputPath: settings.outputPaths.images,
                name: "[name].[ext]",
                publicPath: settings.publicUrlOrPath,
              },
            },
          ],
        },
        // svg
        {
          test: /\.svg$/i,
          exclude: /node_modules/,
          use: [
            "@svgr/webpack",
            {
              loader: "url-loader",
              options: {
                limit: 3000,
                name: "[name].[ext]",
                outputPath: settings.outputPaths.svg,
                publicPath: settings.publicUrlOrPath,
              },
            },
          ],
        },
        {
          test: /\.pug$/i,
          use: {
            loader: "pug-loader",
            options: {
              pretty: settings.__DEV__,
            },
          },
          exclude: "/node_modules/",
        },
      ],
    },

    plugins,
  };
};

export { createWebpackConfig };
