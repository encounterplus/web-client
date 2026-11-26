import { ChangeDetectionStrategy, Component, ElementRef, inject, input, viewChild } from '@angular/core';
import { FloatingWindowRef } from './floating-window-ref';

/**
 * A floating window's content that is a page of its own, such as a character sheet or a stat block.
 *
 * Once the page navigated elsewhere, such as through a link in it, its window offers to take it back
 * to the address it opened with. Where it went can't be read when the page is on another origin,
 * only that it went: the frame loads again.
 */
@Component({
  selector: 'app-iframe-content',
  template: `<iframe #frame [src]="url() | safe: 'resourceUrl'" [title]="title()" (load)="onLoad()"></iframe>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    iframe { display: block; width: 100%; height: 100%; border: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class IframeContentComponent {
  readonly url = input.required<string>()
  readonly title = input('')

  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame')
  private readonly window = inject(FloatingWindowRef, { optional: true })

  /** Pages loaded since the address it opened with: past the first, it navigated elsewhere. */
  private loads = 0

  onLoad() {
    // a frame that has no address yet loads an empty page first, which isn't a page of its own
    if (this.frameAddress() == 'about:blank') {
      return
    }
    this.loads++
    this.window?.back.set(this.loads > 1 ? () => this.restart() : null)
  }

  /** Loads the address it opened with again: the next page it loads is where it started. */
  restart() {
    this.loads = 0
    this.window?.back.set(null)
    this.frame().nativeElement.src = this.url()
  }

  /** The frame's page's address, when it can be read: only on this page's origin, or an empty page. */
  protected frameAddress(): string | null {
    try {
      return this.frame().nativeElement.contentWindow?.location.href ?? null
    } catch {
      return null
    }
  }
}
