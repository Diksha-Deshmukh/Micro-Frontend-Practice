const path = require("path");
const { container } = require("webpack");
const { createConfig } = require("../../webpack/create-config.cjs");
const packageJson = require("./package.json");

const { ModuleFederationPlugin } = container;

module.exports = (_environment, arguments_) => {
  const isProduction = arguments_?.mode === "production" || process.env.NODE_ENV === "production";

  return createConfig({
    appDirectory: __dirname,
    isProduction,
    name: "products",
    outputPath: isProduction
      ? path.resolve(__dirname, "../../backend/MicroFrontendDemo.Api/wwwroot/remotes/products")
      : path.resolve(__dirname, "dist"),
    plugins: [
      new ModuleFederationPlugin({
        name: "products",
        filename: "remoteEntry.js",
        exposes: {
          "./ProductsPage": "./src/ProductsPage",
          "./ProductSummary": "./src/ProductSummary"
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: packageJson.dependencies.react
          },
          "react-dom": {
            singleton: true,
            requiredVersion: packageJson.dependencies["react-dom"]
          },
          "react-router-dom": {
            singleton: true,
            requiredVersion: packageJson.dependencies["react-router-dom"]
          }
        }
      })
    ],
    port: 3001,
    title: "Products",
  });
};
