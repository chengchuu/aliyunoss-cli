export interface SitePwaConfig {
  appName: string;
  enabled: boolean;
  scope: string;
  serviceWorkerUrl: string;
}

interface SiteRuntimeConfig {
  installCommand: string;
  packageName: string;
  themeStorageKey: string;
  pwa: SitePwaConfig;
}

declare const __SITE_RUNTIME_CONFIG__: SiteRuntimeConfig;

export const SITE_RUNTIME_CONFIG = Object.freeze(__SITE_RUNTIME_CONFIG__);
