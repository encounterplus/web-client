export enum Appearance {
  automatic = "automatic",
  light = "light",
  dark = "dark",
}

export const APPEARANCE_STORAGE_KEY = "appearance";

export function normalizeAppearance(value: string | null | undefined): Appearance {
  return Object.values(Appearance).includes(value as Appearance)
    ? value as Appearance
    : Appearance.automatic;
}

export function storedAppearance(storage: Storage = localStorage): Appearance {
  return normalizeAppearance(storage.getItem(APPEARANCE_STORAGE_KEY));
}

export function applyAppearance(
  appearance: Appearance,
  root: HTMLElement = document.documentElement,
): void {
  if (appearance === Appearance.automatic) {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", appearance);
  }
}

export function saveAppearance(
  appearance: Appearance,
  storage: Storage = localStorage,
  root: HTMLElement = document.documentElement,
): void {
  storage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  applyAppearance(appearance, root);
}
