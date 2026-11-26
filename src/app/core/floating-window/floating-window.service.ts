import { Injectable, Type, computed, signal } from '@angular/core';

/** What opens a floating window: its content, and a key that names it while it is open. */
export interface WindowSpec {
  /**
   * Names the window, such as `character:<id>`: opening a key that is open brings that window to
   * the front, and its place and size are kept under it for the next time it opens.
   */
  key: string
  title: string
  component: Type<unknown>
  inputs?: Record<string, unknown>
  /** Where the content opens in a browser tab of its own, offered in the title bar. */
  externalUrl?: string
  /**
   * The size it opens at the first time, within the page; a sheet's when absent. Once moved or
   * resized, it opens where it was left instead.
   */
  size?: WindowSize
}

export interface WindowSize {
  width: number
  height: number
}

/** A character sheet's: wide enough for its columns. */
export const SHEET_SIZE: WindowSize = { width: 720, height: 900 }

/** A window's place and size on the page, in CSS pixels. */
export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

export interface WindowState extends WindowSpec, WindowRect {
  /** Its stacking order: the highest is in front. */
  z: number
  /** Whether it fills the page, its place and size kept for when it no longer does. */
  maximized?: boolean
}

export const MIN_WIDTH = 280
export const MIN_HEIGHT = 200
/** The title bar's height, which always stays on the page so a window can be dragged back. */
export const TITLE_HEIGHT = 32
/** How much of a window stays on the page when dragged past its left or right edge. */
export const KEEP_VISIBLE = 96
/** How far each new window opens from the one before, so they don't stack exactly. */
const CASCADE = 24
/** Below this width a window fills the page: there is no room to move one around. */
export const COMPACT_WIDTH = 420

const STORAGE_KEY = 'encounterplus.windows'
/** How many windows' places are remembered: every stat block opened gets a key of its own. */
const SAVED_LIMIT = 50

/**
 * Keeps a rectangle usable on a page of the given size: no larger than the page, no smaller than a
 * window can be, its title bar on the page and some of it across the page's left and right edges.
 */
export function clampRect(rect: WindowRect, viewportWidth: number, viewportHeight: number): WindowRect {
  const width = Math.min(Math.max(rect.width, Math.min(MIN_WIDTH, viewportWidth)), viewportWidth)
  const height = Math.min(Math.max(rect.height, Math.min(MIN_HEIGHT, viewportHeight)), viewportHeight)
  const keep = Math.min(KEEP_VISIBLE, width)
  return {
    x: Math.round(Math.min(Math.max(rect.x, keep - width), viewportWidth - keep)),
    y: Math.round(Math.min(Math.max(rect.y, 0), Math.max(0, viewportHeight - TITLE_HEIGHT))),
    width: Math.round(width),
    height: Math.round(height),
  }
}

/**
 * The floating windows open on the page, such as character sheets and stat blocks: movable,
 * resizable, any number at once, and above the map but below modal dialogs.
 *
 * The list keeps the order windows opened in, and bringing one to the front only raises its `z`:
 * moving an iframe in the DOM reloads it.
 */
@Injectable({ providedIn: 'root' })
export class FloatingWindowService {
  private readonly list = signal<WindowState[]>([])
  private topZ = 0

  readonly windows = this.list.asReadonly()

  /** The page's size, which windows are kept within. `viewportChanged` updates it. */
  readonly viewport = signal({ width: window.innerWidth, height: window.innerHeight })

  /** Whether the page is too narrow to move windows around, so each fills it. */
  readonly compact = computed(() => this.viewport().width <= COMPACT_WIDTH)

  /** The key of the window in front, if any is open. */
  readonly front = computed(() => {
    let front: WindowState | undefined
    for (const window of this.list()) {
      if (!front || window.z > front.z) {
        front = window
      }
    }
    return front?.key
  })

  /** Opens a window, or brings it to the front when its key is open already. */
  open(spec: WindowSpec) {
    if (this.isOpen(spec.key)) {
      this.focus(spec.key)
      return
    }
    const saved = this.saved()[spec.key]
    const rect = this.clamp(isRect(saved) ? saved : this.defaultRect(spec.size ?? SHEET_SIZE))
    this.list.update(list => [...list, { ...spec, ...rect, z: ++this.topZ }])
  }

  close(key: string) {
    this.list.update(list => list.filter(window => window.key != key))
  }

  /** Closes every window the predicate picks, such as all of a player's character sheets. */
  closeWhere(predicate: (window: WindowState) => boolean) {
    this.list.update(list => list.filter(window => !predicate(window)))
  }

  focus(key: string) {
    if (this.front() == key) {
      return
    }
    const z = ++this.topZ
    this.list.update(list => list.map(window => window.key == key ? { ...window, z } : window))
  }

  isOpen(key: string): boolean {
    return this.list().some(window => window.key == key)
  }

  /** Places a window, kept within the page, and remembers it for the next time its key opens. */
  move(key: string, rect: WindowRect) {
    const clamped = this.clamp(rect)
    this.list.update(list => list.map(window => window.key == key ? { ...window, ...clamped } : window))
    this.save(key, clamped)
  }

  /**
   * Fills the page with a window, or, when it fills it, brings it back to its default size, centred,
   * forgetting where it was left: double-tapping its title bar.
   */
  toggleMaximized(key: string) {
    const window = this.list().find(window => window.key == key)
    if (!window) {
      return
    }
    if (!window.maximized) {
      this.list.update(list => list.map(window => window.key == key ? { ...window, maximized: true } : window))
      return
    }
    const rect = this.clamp(this.defaultRect(window.size ?? SHEET_SIZE, false))
    this.list.update(list => list.map(window => window.key == key ? { ...window, ...rect, maximized: false } : window))
    this.forget(key)
  }

  /** Takes the page's new size and brings any window it left off the page back on. */
  viewportChanged(width: number, height: number) {
    this.viewport.set({ width, height })
    this.list.update(list => list.map(window => ({ ...window, ...this.clamp(window) })))
  }

  clamp(rect: WindowRect): WindowRect {
    const { width, height } = this.viewport()
    return clampRect(rect, width, height)
  }

  /** Centred at the given size within the page, each next one a little down and right when cascading. */
  private defaultRect(size: WindowSize, cascade = true): WindowRect {
    const { width: pageWidth, height: pageHeight } = this.viewport()
    const width = Math.min(pageWidth * 0.96, size.width)
    const height = Math.min(pageHeight * 0.8, size.height)
    const offset = cascade ? (this.list().length % 8) * CASCADE : 0
    return {
      x: (pageWidth - width) / 2 + offset,
      y: (pageHeight - height) / 2 + offset,
      width,
      height,
    }
  }

  private saved(): Record<string, WindowRect> {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      return value && typeof value == 'object' && !Array.isArray(value) ? value : {}
    } catch {
      return {}
    }
  }

  private forget(key: string) {
    const saved = this.saved()
    if (!(key in saved)) {
      return
    }
    delete saved[key]
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      // it opens where it was left next time
    }
  }

  private save(key: string, rect: WindowRect) {
    try {
      // the most recently placed last, so the oldest go first past the limit
      const saved = this.saved()
      delete saved[key]
      saved[key] = rect
      const keys = Object.keys(saved)
      for (const old of keys.slice(0, Math.max(0, keys.length - SAVED_LIMIT))) {
        delete saved[old]
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      // private browsing or a full storage: the window opens in the default place next time
    }
  }
}

function isRect(value: unknown): value is WindowRect {
  const rect = value as WindowRect | null | undefined
  return [rect?.x, rect?.y, rect?.width, rect?.height].every(n => typeof n == 'number' && Number.isFinite(n))
}
