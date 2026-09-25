import gameIcons from './game-icons.json'

/** The family `src/styles.scss` declares the bundled font under. */
export const GAME_ICONS_FONT = 'Game-Icons'

/** What an icon the bundled copy does not know draws as, as in the app. */
export const DEFAULT_GAME_ICON = 'gi-duration'

const glyphs: { [name: string]: string } = gameIcons

const imageExtensions = ['.jpg', '.jpeg', '.png', '.apng', '.gif', '.webp', '.heic']

export type EffectIcon =
  | { kind: 'glyph', char: string }
  | { kind: 'image', src: string, tinted: boolean }

/**
 * What a status effect's `icon` draws as: a glyph from the game icon font for a `gi-` name, else
 * an image for a path with an image extension. An effect without an icon draws the default
 * glyph, as in the app; `null` for an icon that is neither.
 *
 * Images are tinted like glyphs unless their path contains `no-tint`, which keeps full-colour
 * artwork from being darkened by the multiply.
 */
export function resolveEffectIcon(icon?: string | null): EffectIcon | null {
  const value = icon?.trim()
  if (!value) {
    return { kind: 'glyph', char: glyphs[DEFAULT_GAME_ICON] }
  }

  // the app prefixes a collection icon with a slash, so `gi-` names can arrive as `/gi-poisoned`
  const name = value.replace(/^\/+/, '')
  if (name.startsWith('gi-')) {
    return { kind: 'glyph', char: glyphs[name] ?? glyphs[DEFAULT_GAME_ICON] }
  }

  const lower = value.toLowerCase()
  if (imageExtensions.some(ext => lower.endsWith(ext))) {
    return { kind: 'image', src: value.startsWith('/') ? value : '/' + value, tinted: !lower.includes('no-tint') }
  }

  return null
}

let fontReady: Promise<boolean> | null = null

/**
 * Resolves once the font is usable. A canvas draws text once and never redraws it, so drawing
 * before the font loads would keep the fallback glyphs. `false` when it cannot load.
 */
export function loadGameIconsFont(): Promise<boolean> {
  if (fontReady == null) {
    const fonts = typeof document !== 'undefined' ? document.fonts : undefined
    fontReady = fonts == null
      ? Promise.resolve(false)
      : fonts.load(`16px "${GAME_ICONS_FONT}"`).then(faces => faces.length > 0, () => false)
  }
  return fontReady
}
