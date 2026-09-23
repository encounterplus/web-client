// Handles hung off `window`: debugging aids reachable from the browser console,
// plus the bridge the embedding native host uses to push events into the app.
import type * as PIXI from 'pixi.js'
import type { Viewport } from 'pixi-viewport'
import type { AppComponent } from './app/app.component'
import type { AppState } from './app/shared/models/app-state'
import type { WSEvent } from './app/shared/models/wsevent'

declare global {
  interface Window {
    PIXI: typeof PIXI
    state: AppState
    viewport: Viewport
    componentRef: {
      componentFn: (value: WSEvent) => void
      component: AppComponent
    }
  }
}
