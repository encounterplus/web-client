import {
  Appearance,
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  normalizeAppearance,
  saveAppearance,
  storedAppearance,
} from './appearance';

describe('appearance preferences', () => {
  let root: HTMLElement;

  beforeEach(() => {
    localStorage.clear();
    root = document.createElement('div');
  });

  it('defaults unknown and missing preferences to automatic', () => {
    expect(normalizeAppearance(null)).toBe(Appearance.automatic);
    expect(normalizeAppearance('sepia')).toBe(Appearance.automatic);
    expect(storedAppearance()).toBe(Appearance.automatic);
  });

  it('uses no override attribute in automatic mode', () => {
    root.setAttribute('data-theme', 'dark');
    applyAppearance(Appearance.automatic, root);
    expect(root.hasAttribute('data-theme')).toBeFalse();
  });

  it('stores and applies explicit light and dark modes', () => {
    saveAppearance(Appearance.dark, localStorage, root);
    expect(localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe(Appearance.dark);
    expect(root.getAttribute('data-theme')).toBe('dark');

    saveAppearance(Appearance.light, localStorage, root);
    expect(storedAppearance()).toBe(Appearance.light);
    expect(root.getAttribute('data-theme')).toBe('light');
  });
});
