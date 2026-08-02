import {
  isSafePWAEnv,
  isStandalonePWA,
  listenMediaQueryChanges,
  watchServiceWorkerUpdates,
} from "mazey";
import type { ServiceWorkerUpdateWatcher } from "mazey";
import type { SitePwaConfig } from "./runtime-config";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type WindowWithIdleCallback = Window & {
  requestIdleCallback?: (callback: () => void) => number;
};

function announce(message: string): void {
  document
    .querySelectorAll<HTMLElement>("[data-pwa-status]")
    .forEach((region) => {
      region.textContent = message;
    });
}

function setInstallVisibility(hidden: boolean): void {
  document
    .querySelectorAll<HTMLElement>("[data-pwa-install-container]")
    .forEach((element) => {
      element.hidden = hidden;
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-pwa-install]")
    .forEach((button) => {
      button.hidden = hidden;
      button.disabled = hidden;
    });
}

function initializeInstallExperience(appName: string): () => void {
  let deferredPrompt: BeforeInstallPromptEvent | null = null;
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-pwa-install]"),
  );
  let displayMode: MediaQueryList | null = null;
  try {
    displayMode = window.matchMedia("(display-mode: standalone)");
  } catch {
    // Standalone detection remains safe through Mazey's compatibility helper.
  }

  const handlePrompt = (event: Event) => {
    if (isStandalonePWA()) return;
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    setInstallVisibility(false);
  };
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    setInstallVisibility(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      announce(
        choice.outcome === "accepted"
          ? "The app installation was accepted."
          : "Installation was dismissed. You can use the browser install menu later.",
      );
    } catch {
      announce(
        "The install prompt was unavailable. Use the browser install menu instead.",
      );
    }
  };
  const handleInstalled = () => {
    deferredPrompt = null;
    setInstallVisibility(true);
    announce(`${appName} was installed.`);
  };
  const handleDisplayMode = () => {
    if (isStandalonePWA()) setInstallVisibility(true);
  };

  if (isStandalonePWA()) setInstallVisibility(true);
  buttons.forEach((button) => button.addEventListener("click", handleInstall));
  window.addEventListener("beforeinstallprompt", handlePrompt);
  window.addEventListener("appinstalled", handleInstalled);
  const stopDisplayMode = listenMediaQueryChanges(
    displayMode,
    handleDisplayMode,
  );

  return () => {
    buttons.forEach((button) =>
      button.removeEventListener("click", handleInstall),
    );
    window.removeEventListener("beforeinstallprompt", handlePrompt);
    window.removeEventListener("appinstalled", handleInstalled);
    stopDisplayMode();
  };
}

function monitorUpdates(
  registration: ServiceWorkerRegistration,
): ServiceWorkerUpdateWatcher {
  const notice = document.querySelector<HTMLElement>("[data-pwa-update]");
  const button = document.querySelector<HTMLButtonElement>(
    "[data-pwa-update-now]",
  );
  let reloadRequested = false;
  const watcher = watchServiceWorkerUpdates(
    registration,
    navigator.serviceWorker,
    {
      onUpdateAvailable() {
        if (notice) notice.hidden = false;
        announce("A new website version is available.");
      },
      onControllerChange() {
        if (notice) notice.hidden = true;
        if (reloadRequested) window.location.reload();
      },
    },
  );
  button?.addEventListener("click", () => {
    reloadRequested = watcher.activateWaiting();
    if (reloadRequested) {
      button.disabled = true;
      announce("Updating the website now.");
    }
  });
  return watcher;
}

async function registerServiceWorker(config: SitePwaConfig): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(
      config.serviceWorkerUrl,
      { scope: config.scope },
    );
    monitorUpdates(registration);
  } catch (error) {
    console.error(
      `Failed to register the ${config.appName} service worker.`,
      error,
    );
  }
}

export function shouldRegisterSiteServiceWorker(
  config: SitePwaConfig,
): boolean {
  return (
    config.enabled &&
    isSafePWAEnv({ requireManifest: true, scope: config.scope })
  );
}

export function initializeSitePwa(config: SitePwaConfig): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const root = document.documentElement;
  if (root.dataset.pwaReady === "true") return;
  root.dataset.pwaReady = "true";
  initializeInstallExperience(config.appName);
  if (!shouldRegisterSiteServiceWorker(config)) return;

  const schedule = () => {
    const idleWindow = window as unknown as WindowWithIdleCallback;
    if (idleWindow.requestIdleCallback) {
      idleWindow.requestIdleCallback(() => void registerServiceWorker(config));
    } else {
      window.setTimeout(() => void registerServiceWorker(config), 0);
    }
  };
  if (document.readyState === "complete") schedule();
  else window.addEventListener("load", schedule, { once: true });
}
