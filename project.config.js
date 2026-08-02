const {
  deepFreeze,
  derivePackageMetadata,
  parseGitHubRepository,
} = require("mazey");
const pkg = require("./package.json");

const packageDetails = derivePackageMetadata(pkg, { packageManager: "npm" });
const repository = parseGitHubRepository(pkg.repository.url);
const siteUrl = new URL(pkg.homepage);
const basePath = siteUrl.pathname.endsWith("/")
  ? siteUrl.pathname
  : `${siteUrl.pathname}/`;
const githubUrl = repository.url;
const npmUrl = `https://www.npmjs.com/package/${pkg.name}`;
const pages = {
  home: {
    title: "aliyunoss-cli - Upload directories to Alibaba Cloud OSS",
    description:
      "Configure and run aliyunoss-cli to recursively upload a local directory to Alibaba Cloud OSS with environment-specific source and target paths.",
    url: siteUrl.href,
  },
  playground: {
    title: "aliyunoss-cli Playground - Configure an OSS client",
    description:
      "Use the aliyunoss-cli package root to configure an Alibaba Cloud OSS client in the browser without sending files or network requests.",
    url: new URL("playground/", siteUrl).href,
  },
  api: {
    title: "aliyunoss-cli API Documentation",
    description:
      "TypeScript API documentation and package guidance for the aliyunoss-cli Alibaba Cloud OSS upload command.",
    url: new URL("api/", siteUrl).href,
  },
};
const primary = {
  light: {
    base: "#4d8ffb",
    hover: "#256fd8",
    active: "#185aaa",
    soft: "#eaf2ff",
    rgb: "77, 143, 251",
    hoverRgb: "37, 111, 216",
    activeRgb: "24, 90, 170",
  },
  dark: {
    base: "#5089e8",
    hover: "#6198ee",
    active: "#74a5f3",
    soft: "#1b3155",
    rgb: "80, 137, 232",
    hoverRgb: "97, 152, 238",
    activeRgb: "116, 165, 243",
  },
};
const theme = {
  storageKey: `${packageDetails.unscopedName}-theme`,
  colorPrimary: primary.light.base,
  colorLight: "#f7f8fc",
  colorDark: "#0d1220",
  primary,
};
const icons = [
  { file: "logo-192x192.png", sizes: "192x192", purpose: "any" },
  { file: "logo-512x512.png", sizes: "512x512", purpose: "any" },
  {
    file: "logo-maskable-512x512.png",
    sizes: "512x512",
    purpose: "maskable",
  },
];
const software = {
  "@type": "SoftwareApplication",
  name: pkg.name,
  description: pages.home.description,
  url: pages.home.url,
  codeRepository: githubUrl,
  downloadUrl: npmUrl,
  applicationCategory: "DeveloperApplication",
  license: `${githubUrl}/blob/master/LICENSE`,
};

module.exports = deepFreeze({
  package: packageDetails,
  repository,
  brand: { displayName: pkg.name, shortName: "Aliyun OSS CLI" },
  urls: {
    github: githubUrl,
    npm: npmUrl,
    license: `${githubUrl}/blob/master/LICENSE`,
    sitemap: new URL("sitemap.xml", siteUrl).href,
  },
  assets: {
    faviconFile: "logo-32x32.png",
    logoFile: "logo-192x192.png",
  },
  site: {
    url: siteUrl.href,
    basePath,
    markerPrefix: packageDetails.unscopedName,
    pages,
    theme,
  },
  seo: {
    openGraphImage: {
      file: "logo-open-graph-1200x630.png",
      url: new URL("images/logo-open-graph-1200x630.png", siteUrl).href,
      width: 1200,
      height: 630,
      type: "image/png",
      alt: "aliyunoss-cli project logo on an abstract technology background.",
    },
    rootJsonLd: { "@context": "https://schema.org", ...software },
    playgroundJsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "aliyunoss-cli OSS client playground",
      description: pages.playground.description,
      url: pages.playground.url,
      isPartOf: {
        "@type": "WebSite",
        name: pkg.name,
        url: pages.home.url,
      },
      about: software,
    },
  },
  pwa: {
    name: "aliyunoss-cli documentation",
    shortName: "Aliyun OSS CLI",
    description:
      "Project website, browser playground, and API documentation for aliyunoss-cli.",
    display: "standalone",
    backgroundColor: theme.colorLight,
    themeColor: theme.colorPrimary,
    manifestUrl: `${basePath}manifest.webmanifest`,
    serviceWorkerUrl: `${basePath}service-worker.js`,
    cachePrefix: `${packageDetails.unscopedName}-site-`,
    icons: icons.map(({ file, ...icon }) => ({
      ...icon,
      file,
      type: "image/png",
      src: `${basePath}images/${file}`,
    })),
  },
});
