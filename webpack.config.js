"use strict";

const path = require("path");

const config = {
  target: "electron-renderer",

  entry: "./webview/render/index.tsx",
  output: {
    path: path.resolve(__dirname, "dist", "webview"),
    filename: "webview.js",
    devtoolModuleFilenameTemplate: "../[resource-path]"
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode"
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [path.resolve(__dirname, "webview")],
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.webview.json"
            }
          }
        ]
      }
    ]
  }
};

module.exports = config;
