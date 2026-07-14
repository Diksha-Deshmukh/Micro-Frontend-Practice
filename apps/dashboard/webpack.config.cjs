const path = require("path");
const { container } = require("webpack");
const { createConfig } = require("../../webpack/create-config.cjs");
const packageJson = require("./package.json");

const { ModuleFederationPlugin } = container;

module.exports = (_environment, arguments_) => {
  const isProduction =
    arguments_?.mode === "production" || process.env.NODE_ENV === "production";
  const remotes = isProduction
    ? {
        products: "products@/remotes/products/remoteEntry.js",
        users: "users@/remotes/users/remoteEntry.js"
      }
    : {
        products: "products@http://localhost:3001/remoteEntry.js",
        users: "users@http://localhost:3002/remoteEntry.js"
      };

  return createConfig({
    appDirectory: __dirname,
    clean: { keep: /^remotes\// },
    isProduction,
    name: "dashboard",
    outputPath: path.resolve(__dirname, "../../backend/MicroFrontendDemo.Api/wwwroot"),
    plugins: [
      new ModuleFederationPlugin({
        name: "dashboard",
        remotes,
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
    port: 3000,
    title: "GitHub Practice Demo",
  });
};
