import { Injectable, signal } from '@angular/core';

/**
 * What a floating window's content can ask of its window, found through Angular's injector: each
 * window provides its own.
 */
@Injectable()
export class FloatingWindowRef {
  /**
   * Takes the content back to where it started, such as a sheet after a link in it was followed;
   * the title bar offers it while it is set.
   */
  readonly back = signal<(() => void) | null>(null)
}
