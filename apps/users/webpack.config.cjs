const path = require("path");
const { container } = require("webpack");
const { createConfig } = require("../../webpack/create-config.cjs");
const { dependencies } = require("./package.json");

const { ModuleFederationPlugin } = container;

module.exports = (_environment, arguments_ = {}) => {
  const isProduction = arguments_.mode === "production" || process.env.NODE_ENV === "production";

  return createConfig({
    appDirectory: __dirname,
    isProduction,
    name: "users",
    outputPath: isProduction
      ? path.resolve(__dirname, "../../backend/MicroFrontendDemo.Api/wwwroot/remotes/users")
      : path.resolve(__dirname, "dist"),
    plugins: [
      new ModuleFederationPlugin({
        name: "users",
        filename: "remoteEntry.js",
        exposes: {
          "./UsersPage": "./src/UsersPage",
          "./UserSummary": "./src/UserSummary"
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: dependencies.react
          },
          "react-dom": {
            singleton: true,
            requiredVersion: dependencies["react-dom"]
          },
          "react-router-dom": {
            singleton: true,
            requiredVersion: dependencies["react-router-dom"]
          }
        }
      })
    ],
    port: 3002,
    title: "Users",
  });
};
