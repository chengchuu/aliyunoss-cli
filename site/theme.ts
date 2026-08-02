import {
  getSystemTheme,
  listenMediaQueryChanges,
  resolveThemePreference,
  setThemePreference,
} from "mazey";
import type { ResolvedTheme, ThemePreference } from "mazey";

function preferenceFromLabel(
  label: string,
  value: ResolvedTheme,
): ThemePreference {
  return label === "System" ? "system" : value;
}

export function initializeThemeControls(storageKey: string): () => void {
  const root = document.documentElement;
  if (root.dataset.themeControlsReady === "true") return () => undefined;

  let systemMedia: MediaQueryList | null = null;
  try {
    systemMedia = window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    // Mazey supplies a deterministic fallback when system detection is unavailable.
  }

  const initial = resolveThemePreference(storageKey);
  let selected = preferenceFromLabel(initial.label, initial.value);

  const apply = (preference: ThemePreference, resolved: ResolvedTheme) => {
    root.dataset.bsTheme = resolved;
    root.dataset.theme = resolved;
    root.style.colorScheme = resolved;
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"][data-theme-color]',
    );
    if (themeColor) {
      themeColor.content =
        resolved === "dark"
          ? (themeColor.dataset.themeColorDark ?? themeColor.content)
          : (themeColor.dataset.themeColorLight ?? themeColor.content);
    }
    document
      .querySelectorAll<HTMLSelectElement>("[data-theme-select]")
      .forEach((control) => {
        control.value = preference;
      });
    const typeDocControl =
      document.querySelector<HTMLSelectElement>("#tsd-theme");
    if (typeDocControl)
      typeDocControl.value = preference === "system" ? "os" : preference;
  };

  const resolveForSession = (
    preference: ThemePreference,
    stored: boolean,
  ): ResolvedTheme => {
    const resolved = resolveThemePreference(storageKey);
    if (stored) return resolved.value;
    if (preference === "system") return getSystemTheme() ?? "light";
    return preference;
  };

  const handleChange = (event: Event) => {
    const control = event.target;
    if (!(control instanceof HTMLSelectElement)) return;
    let preference: ThemePreference;
    if (control.matches("[data-theme-select]")) {
      preference = control.value as ThemePreference;
    } else if (control.id === "tsd-theme") {
      preference =
        control.value === "os" ? "system" : (control.value as ThemePreference);
    } else {
      return;
    }
    const stored = setThemePreference(storageKey, preference);
    selected = preference;
    apply(preference, resolveForSession(preference, stored));
  };
  const handleSystemChange = () => {
    if (selected !== "system") return;
    const resolved = resolveThemePreference(storageKey);
    apply(
      "system",
      resolved.label === "System"
        ? resolved.value
        : (getSystemTheme() ?? "light"),
    );
  };

  root.dataset.themeControlsReady = "true";
  apply(selected, initial.value);
  document.addEventListener("change", handleChange);
  const handleDocumentReady = () => {
    const resolved = resolveThemePreference(storageKey);
    apply(
      selected,
      selected === "system"
        ? resolved.label === "System"
          ? resolved.value
          : (getSystemTheme() ?? "light")
        : selected,
    );
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", handleDocumentReady, {
      once: true,
    });
  const stopListening = listenMediaQueryChanges(
    systemMedia,
    handleSystemChange,
  );

  return () => {
    document.removeEventListener("change", handleChange);
    document.removeEventListener("DOMContentLoaded", handleDocumentReady);
    stopListening();
    delete root.dataset.themeControlsReady;
  };
}
