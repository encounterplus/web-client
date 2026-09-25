import * as PIXI from 'pixi.js'
import { StatusEffect } from 'src/app/shared/models/status-effect'
import { EffectIcon, GAME_ICONS_FONT, loadGameIconsFont, resolveEffectIcon } from 'src/app/shared/icons/game-icons'
import { Loader } from '../models/loader'

/** How many effects a token shows; any beyond are left off. */
export const MAX_STATUS_EFFECTS = 16

/** Cells across the token's shorter side, so each is a quarter of it. */
export const STATUS_EFFECTS_PER_SIDE = 4

/** Rows the cells fill, column by column, as in the app. */
export const STATUS_EFFECTS_ROWS = 2

/** The cell's corner radius, as a fraction of the cell. */
const CORNER_RADIUS = 0.12

/** The font size glyphs are rasterised at; big enough to stay sharp on a zoomed-in token. */
const GLYPH_SIZE = 256

export interface CellFrame {
  x: number
  y: number
  size: number
}

/**
 * Where each effect's cell goes over a token of `width` × `height`, laid out as the app lays them
 * out: square cells a quarter of the token's shorter side, in two rows from the top-left corner,
 * filled column by column — top, then bottom, then the next column to the right.
 */
export function statusEffectFrames(count: number, width: number, height: number): CellFrame[] {
  const size = Math.min(width, height) / STATUS_EFFECTS_PER_SIDE
  const frames: CellFrame[] = []
  for (let i = 0; i < Math.min(count, MAX_STATUS_EFFECTS); i++) {
    frames.push({
      x: Math.floor(i / STATUS_EFFECTS_ROWS) * size,
      y: (i % STATUS_EFFECTS_ROWS) * size,
      size: size,
    })
  }
  return frames
}

/** The effects a token draws: enabled ones, up to the cap. */
export function visibleStatusEffects(effects?: StatusEffect[] | null): StatusEffect[] {
  return (effects ?? []).filter(effect => effect.enabled !== false).slice(0, MAX_STATUS_EFFECTS)
}

/** The effect's colour as a tint, white when it has none or one that does not parse. */
export function statusEffectTint(color?: string | null): number {
  if (!color) {
    return 0xffffff
  }
  try {
    return new PIXI.Color(color).toNumber()
  } catch {
    return 0xffffff
  }
}

/**
 * The status effects over a token: a half-transparent black square per effect, with its icon
 * tinted in the effect's colour.
 */
export class StatusEffectsView extends PIXI.Container {

  /** What the cells on screen were drawn from, so a redraw with nothing changed is skipped. */
  private signature: string | null = null
  /** Discards a draw that a later one overtook while its icons were loading. */
  private generation = 0

  async draw(effects: StatusEffect[] | null | undefined, width: number, height: number) {
    const visible = visibleStatusEffects(effects)
    const signature = `${width}x${height}|` + visible.map(effect => `${effect.id}:${effect.icon ?? ''}:${effect.color ?? ''}`).join(';')
    if (signature == this.signature) {
      return
    }
    this.signature = signature
    const generation = ++this.generation

    const frames = statusEffectFrames(visible.length, width, height)
    const cells = await Promise.all(visible.map((effect, index) => this.cell(effect, frames[index])))

    if (generation != this.generation || this.destroyed) {
      cells.forEach(cell => cell.destroy({ children: true }))
      return
    }

    this.removeChildren().forEach(child => child.destroy({ children: true }))
    cells.forEach(cell => this.addChild(cell))
  }

  private async cell(effect: StatusEffect, frame: CellFrame): Promise<PIXI.Container> {
    const cell = new PIXI.Container()
    cell.position.set(frame.x, frame.y)

    const background = new PIXI.Graphics()
      .roundRect(0, 0, frame.size, frame.size, frame.size * CORNER_RADIUS)
      .fill({ color: 0x000000, alpha: 0.5 })
      .stroke({ width: 1, color: 0x000000 })
    cell.addChild(background)

    const resolved = resolveEffectIcon(effect.icon)
    const icon = await this.icon(resolved, frame.size)
    if (icon != null) {
      if (resolved?.kind == 'glyph' || resolved?.tinted) {
        icon.tint = statusEffectTint(effect.color)
      }
      icon.position.set(frame.size / 2, frame.size / 2)
      cell.addChild(icon)
    }

    return cell
  }

  private async icon(icon: EffectIcon | null, size: number): Promise<PIXI.Sprite | null> {
    if (icon == null || size <= 0) {
      return null
    }

    switch (icon.kind) {
      case 'glyph': {
        if (!await loadGameIconsFont()) {
          return null
        }
        const texture = glyphTexture(icon.char)
        if (texture == null) {
          return null
        }
        const sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5, 0.5)
        fit(sprite, size)
        return sprite
      }

      case 'image': {
        let texture: PIXI.Texture
        try {
          texture = await Loader.shared.loadTexture(icon.src)
        } catch (error) {
          console.warn(`failed to load status effect icon: ${icon.src}`, error)
          return null
        }
        const sprite = new PIXI.Sprite(texture)
        sprite.anchor.set(0.5, 0.5)
        fit(sprite, size)
        return sprite
      }
    }
  }
}

const glyphTextures = new Map<string, PIXI.Texture>()

/**
 * The glyph drawn white onto a canvas cropped to its own outline, shared by every cell showing it.
 *
 * Not a `PIXI.Text`: that centres on the font's line box, and game icons do not sit in the middle
 * of it, so a glyph like `gi-dead-head` would land off-centre. Cropping to the glyph's bounds
 * lets the sprite centre and fit on the shape itself.
 */
function glyphTexture(char: string): PIXI.Texture | null {
  const cached = glyphTextures.get(char)
  if (cached != null) {
    return cached
  }

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (context == null) {
    return null
  }
  const font = `${GLYPH_SIZE}px "${GAME_ICONS_FONT}"`
  context.font = font
  const metrics = context.measureText(char)
  const left = metrics.actualBoundingBoxLeft
  const ascent = metrics.actualBoundingBoxAscent
  const width = Math.ceil(left + metrics.actualBoundingBoxRight)
  const height = Math.ceil(ascent + metrics.actualBoundingBoxDescent)
  if (!(width > 0 && height > 0)) {
    return null
  }

  // a pixel of room on each side, so antialiasing at the edge is not clipped
  canvas.width = width + 2
  canvas.height = height + 2
  // resizing resets the context
  context.font = font
  context.textBaseline = 'alphabetic'
  // white, so the tint alone gives the colour
  context.fillStyle = '#ffffff'
  context.fillText(char, left + 1, ascent + 1)

  // mipmaps keep the glyph smooth when a zoomed-out map shrinks it to a few pixels
  const texture = new PIXI.Texture({ source: new PIXI.CanvasSource({ resource: canvas, autoGenerateMipmaps: true }) })
  glyphTextures.set(char, texture)
  return texture
}

/** Scales `view` to fit a `size` square, keeping its proportions. */
function fit(view: PIXI.Container, size: number) {
  const longest = Math.max(view.width, view.height)
  if (longest > 0) {
    view.scale.set(view.scale.x * size / longest)
  }
}
