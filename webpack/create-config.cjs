const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

function createConfig({ appDirectory, clean = true, isProduction, name, outputPath, plugins, port, title }) {
  return {
    mode: isProduction ? "production" : "development",
    entry: path.join(appDirectory, "src/index.ts"),
    output: {
      path: outputPath,
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      chunkFilename: isProduction ? "[name].[contenthash].js" : "[name].js",
      publicPath: "auto",
      clean,
      uniqueName: name
    },
    devtool: isProduction ? "source-map" : "eval-cheap-module-source-map",
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader",
          exclude: /node_modules/,
          options: {
            compilerOptions: {
              noEmit: false
            }
          }
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.join(appDirectory, "index.html"),
        title
      }),
      ...plugins
    ],
    devServer: {
      port,
      hot: true,
      historyApiFallback: true,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      proxy: [
        {
          context: ["/api", "/health"],
          target: "http://localhost:5000"
        }
      ]
    },
    optimization: {
      runtimeChunk: false
    }
  };
}

module.exports = { createConfig };
