import { defineConfig } from "rollup";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import json from "@rollup/plugin-json";

import analyze from "rollup-plugin-analyzer";
import { terser } from "rollup-plugin-terser";

import pkg from "./package.json";

const MODE =
  process.env.NODE_ENV === "development" ? "development" : "production";
const __PROD__ = MODE === "production";

console.log({ __PROD__, MODE });

export default defineConfig([
  {
    input: "src/index.ts",

    output: [
      {
        file: "dist/index.cjs.js",
        format: "cjs",
        sourcemap: true,
      },
    ],

    watch: {
      clearScreen: true,
      exclude: "node_modules/**",
      include: "src/**",
    },

    plugins: [
      peerDepsExternal(),
      json(),
      commonjs({
        sourceMap: true,
      }),
      typescript({
        tsconfig: "./tsconfig.json",
        exclude: ["node_modules"],
      }),
      __PROD__ &&
        terser({
          mangle: true,
          compress: {
            defaults: true,
            drop_console: false, // false by default. Pass true to discard calls to console.* functions.
            passes: 2, // 1 by default. The maximum number of times to run compress.
          },
          format: {
            comments: false, // "some" by default
            preamble: null, // null by default. When passed it must be a string and it will be prepended to the output literally. The source map will adjust for this text. Can be used to insert a comment containing licensing information, for example.
            quote_style: 3, // 0 by default. 3 - always use the original quotes.
            preserve_annotations: false, // false by default.
            ecma: 2019, // 5 by default. Desired EcmaScript standard version for output.
          },
          ecma: 2019, // 5 by default. Desired EcmaScript standard version for output.
          keep_classnames: false, // undefined by default.
          keep_fnames: false, // false by default.
          safari10: false, // false by default.
        }),
      __PROD__ &&
        analyze({
          hideDeps: true,
          summaryOnly: true,
        }),
    ].filter(Boolean),
  },
  {
    input: pkg.source,
    output: [{ file: pkg.types, format: "es" }],
    plugins: [
      dts({
        compilerOptions: {
          baseUrl: "./src",
        },
      }),
    ],
  },
]);
