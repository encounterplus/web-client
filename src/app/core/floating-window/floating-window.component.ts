import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FloatingWindowService, MIN_HEIGHT, MIN_WIDTH, WindowRect, WindowState } from './floating-window.service';

/** Which edges a resize handle moves: `n`, `s`, `e`, `w`, or a corner such as `se`. */
export type ResizeEdges = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface Gesture {
  pointerId: number
  startX: number
  startY: number
  start: WindowRect
  /** `move`, or the edges a resize moves. */
  mode: 'move' | ResizeEdges
}

/**
 * One floating window: a title bar to drag it by, with a link to open its content in a tab of its
 * own and a close button, its content, and handles on its edges and corners to resize it.
 *
 * While a pointer drags or resizes it, the window follows locally and tells the service where it
 * ended up only when the pointer lets go. Only the window in front takes pointers in its content:
 * a click elsewhere in another window brings that one forward first, because a click inside an
 * iframe never reaches the page.
 */
@Component({
  selector: 'app-floating-window',
  templateUrl: './floating-window.component.html',
  styleUrls: ['./floating-window.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
  host: {
    'role': 'dialog',
    '[attr.aria-label]': 'win().title',
    '[attr.data-window-key]': 'win().key',
    '[class.front]': 'front()',
    '[class.compact]': 'compact()',
    '[class.interacting]': 'live() !== null',
    '[style.left.px]': 'compact() ? null : rect().x',
    '[style.top.px]': 'compact() ? null : rect().y',
    '[style.width.px]': 'compact() ? null : rect().width',
    '[style.height.px]': 'compact() ? null : rect().height',
    '[style.z-index]': 'win().z',
    '(pointerdown)': 'bringToFront()',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
    // the browser can take the pointer away without either, and a gesture left open blocks the next
    '(lostpointercapture)': 'onPointerUp($event)',
  },
})
export class FloatingWindowComponent {
  readonly win = input.required<WindowState>()

  readonly edges: ResizeEdges[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']

  /** Where the window is while a pointer drags or resizes it; `null` otherwise. */
  readonly live = signal<WindowRect | null>(null)

  readonly rect = computed<WindowRect>(() => {
    const { x, y, width, height } = this.win()
    return this.live() ?? { x, y, width, height }
  })

  readonly front = computed(() => this.windows.front() == this.win().key)
  readonly compact = this.windows.compact

  private gesture: Gesture | null = null

  constructor(private windows: FloatingWindowService) {}

  bringToFront() {
    this.windows.focus(this.win().key)
  }

  close() {
    this.windows.close(this.win().key)
  }

  /** Starts dragging by the title bar, unless the pointer went down on one of its buttons. */
  startMove(event: PointerEvent) {
    if ((event.target as Element).closest('a, button')) {
      return
    }
    this.begin(event, 'move')
  }

  startResize(event: PointerEvent, edges: ResizeEdges) {
    this.begin(event, edges)
  }

  onPointerMove(event: PointerEvent) {
    const gesture = this.gesture
    if (!gesture || event.pointerId != gesture.pointerId) {
      return
    }
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    const next = gesture.mode == 'move'
      ? { ...gesture.start, x: gesture.start.x + dx, y: gesture.start.y + dy }
      : resized(gesture.start, gesture.mode, dx, dy)
    this.live.set(this.windows.clamp(next))
  }

  onPointerUp(event: PointerEvent) {
    const gesture = this.gesture
    if (!gesture || event.pointerId != gesture.pointerId) {
      return
    }
    this.gesture = null
    const rect = this.live()
    this.live.set(null)
    if (rect) {
      this.windows.move(this.win().key, rect)
    }
  }

  private begin(event: PointerEvent, mode: Gesture['mode']) {
    if (event.button != 0 || this.compact() || this.gesture) {
      return
    }
    // the element keeps getting the pointer's events wherever it goes, iframes included, and they
    // bubble up to this component's listeners
    try {
      (event.currentTarget as Element).setPointerCapture(event.pointerId)
    } catch {
      // a pointer that is already gone: the gesture ends with its pointerup or pointercancel
    }
    this.gesture = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, start: this.rect(), mode }
    this.live.set(this.rect())
    event.preventDefault()
  }
}

/** A rectangle resized by dragging the given edges by a distance, no smaller than a window can be. */
export function resized(start: WindowRect, edges: ResizeEdges, dx: number, dy: number): WindowRect {
  let { x, y, width, height } = start
  if (edges.includes('e')) {
    width = Math.max(MIN_WIDTH, start.width + dx)
  }
  if (edges.includes('w')) {
    width = Math.max(MIN_WIDTH, start.width - dx)
    x = start.x + start.width - width
  }
  if (edges.includes('s')) {
    height = Math.max(MIN_HEIGHT, start.height + dy)
  }
  if (edges.includes('n')) {
    height = Math.max(MIN_HEIGHT, start.height - dy)
    y = start.y + start.height - height
    if (y < 0) {
      // the top edge stops at the top of the page rather than pushing the window down
      height += y
      y = 0
    }
  }
  return { x, y, width, height }
}
