const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("node:path");
const webpack = require("webpack");
const projectConfig = require("../project.config.js");

const root = path.resolve(__dirname, "..");
const pagesBase =
  process.env.GITHUB_PAGES === "true" ? projectConfig.site.basePath : "/";
const pwaEnabled = process.env.GITHUB_PAGES === "true";
const imageEntries = [
  ...new Set([
    projectConfig.assets.faviconFile,
    projectConfig.assets.logoFile,
    ...projectConfig.pwa.icons.map(({ file }) => file),
    projectConfig.seo.openGraphImage.file,
  ]),
].map((file) => path.join(root, "images", file));
const { pages, theme } = projectConfig.site;
const social = projectConfig.seo.openGraphImage;
const templateParameters = {
  API_URL: pages.api.url,
  DISPLAY_NAME: projectConfig.brand.displayName,
  FAVICON_URL: `${pagesBase}images/${projectConfig.assets.faviconFile}`,
  GITHUB_URL: projectConfig.urls.github,
  INSTALL_COMMAND: "npm install --save-dev aliyunoss-cli",
  LICENSE_URL: projectConfig.urls.license,
  LOGO_URL: `${pagesBase}images/${projectConfig.assets.logoFile}`,
  MANIFEST_URL: pwaEnabled ? projectConfig.pwa.manifestUrl : null,
  NPM_URL: projectConfig.urls.npm,
  OPEN_GRAPH_IMAGE_ALT: social.alt,
  OPEN_GRAPH_IMAGE_HEIGHT: social.height,
  OPEN_GRAPH_IMAGE_TYPE: social.type,
  OPEN_GRAPH_IMAGE_URL: social.url,
  OPEN_GRAPH_IMAGE_WIDTH: social.width,
  PACKAGE_NAME: projectConfig.package.name,
  EXAMPLES_DESCRIPTION: pages.examples.description,
  EXAMPLES_JSON_LD: JSON.stringify(projectConfig.seo.examplesJsonLd),
  EXAMPLES_TITLE: pages.examples.title,
  EXAMPLES_URL: pages.examples.url,
  ROOT_DESCRIPTION: pages.home.description,
  ROOT_JSON_LD: JSON.stringify(projectConfig.seo.rootJsonLd),
  ROOT_TITLE: pages.home.title,
  SITEMAP_URL: projectConfig.urls.sitemap,
  SITE_URL: projectConfig.site.url,
  THEME_COLOR_DARK: theme.colorDark,
  THEME_COLOR_LIGHT: theme.colorLight,
  THEME_COLOR_PRIMARY: theme.colorPrimary,
  THEME_PRIMARY_ACTIVE: theme.primary.light.active,
  THEME_PRIMARY_ACTIVE_RGB: theme.primary.light.activeRgb,
  THEME_PRIMARY_DARK: theme.primary.dark.base,
  THEME_PRIMARY_DARK_ACTIVE: theme.primary.dark.active,
  THEME_PRIMARY_DARK_ACTIVE_RGB: theme.primary.dark.activeRgb,
  THEME_PRIMARY_DARK_HOVER: theme.primary.dark.hover,
  THEME_PRIMARY_DARK_HOVER_RGB: theme.primary.dark.hoverRgb,
  THEME_PRIMARY_DARK_RGB: theme.primary.dark.rgb,
  THEME_PRIMARY_DARK_SOFT: theme.primary.dark.soft,
  THEME_PRIMARY_HOVER: theme.primary.light.hover,
  THEME_PRIMARY_HOVER_RGB: theme.primary.light.hoverRgb,
  THEME_PRIMARY_RGB: theme.primary.light.rgb,
  THEME_PRIMARY_SOFT: theme.primary.light.soft,
};
const runtimeConfig = {
  installCommand: templateParameters.INSTALL_COMMAND,
  packageName: projectConfig.package.name,
  themeStorageKey: theme.storageKey,
  pwa: {
    appName: projectConfig.pwa.name,
    enabled: pwaEnabled,
    scope: projectConfig.site.basePath,
    serviceWorkerUrl: projectConfig.pwa.serviceWorkerUrl,
  },
};

module.exports = {
  mode: "development",
  entry: {
    shared: [path.join(root, "site/shared.ts"), ...imageEntries],
    home: { import: path.join(root, "site/index.ts"), dependOn: "shared" },
    examples: {
      import: path.join(root, "examples/index.tsx"),
      dependOn: "shared",
    },
    api: path.join(root, "site/api.ts"),
  },
  output: {
    clean: true,
    filename: "assets/[name].js",
    path: path.join(root, "dist-dev"),
    publicPath: pagesBase,
  },
  devServer: {
    host: "0.0.0.0",
    port: 8080,
    static: [{ directory: path.join(root, "dist-dev") }],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: { configFile: "tsconfig.site.json" },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.png$/i,
        type: "asset/resource",
        generator: { filename: "images/[name][ext]" },
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      __SITE_RUNTIME_CONFIG__: JSON.stringify(runtimeConfig),
    }),
    new MiniCssExtractPlugin({ filename: "assets/[name].css" }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: path.join(root, "site/index.html"),
      chunks: ["shared", "home"],
      inject: "body",
      templateParameters,
    }),
    new HtmlWebpackPlugin({
      filename: "examples/index.html",
      template: path.join(root, "examples/index.html"),
      chunks: ["shared", "examples"],
      inject: "body",
      templateParameters,
    }),
  ],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: { "aliyunoss-cli$": root },
  },
  performance: {
    maxAssetSize: 900000,
    maxEntrypointSize: 900000,
  },
};
