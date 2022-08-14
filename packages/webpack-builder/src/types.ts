import { Configuration, Compiler, WebpackPluginInstance } from "webpack";
import type { Configuration as DevServerConfiguration } from "webpack-dev-server";

type WebpackPlugin =
  | ((this: Compiler, compiler: Compiler) => void)
  | WebpackPluginInstance;

export type { WebpackPlugin, Configuration, DevServerConfiguration };
