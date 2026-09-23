import { Screen, ScreenInteraction, SharedVision } from './screen'
import { Grid } from 'src/app/core/map/models/grid'
import { Game, emptyGame } from './game'
import { Map } from './map'
import { Combatant } from './combatant'
import { Message } from './message'
import { SquareGrid } from 'src/app/core/map/models/square-grid'
import { TrackedObject } from './tracked-object'
import { signal } from '@angular/core'

export enum ViewMode {
  dm = "dm",
  player = "player",
  spectator = "spectator",
}

export enum RunMode {
  normal = "normal",
  tv = "tv",
}

// The raw values come from the query string and localStorage, so they are
// arbitrary strings: anything that is not a known mode reads back as undefined
// and the caller picks the default.
export function parseViewMode(value: string | null): ViewMode | undefined {
  return Object.values(ViewMode).find(mode => mode === value)
}

export function parseRunMode(value: string | null): RunMode | undefined {
  return Object.values(RunMode).find(mode => mode === value)
}

export class AppState {
  map?: Map
  game: Game = emptyGame()
  screen: Screen = {
    overlayHandoutStyle: "",
    interaction: ScreenInteraction.none,
    sharedVision: SharedVision.never,
    tableTopMode: false,
    scrollLock: false,
    width: 0,
    height: 0,
  }
  messages: Array<Message> = []
  trackedObjects: Array<TrackedObject> = []
  grid: Grid = new SquareGrid()
  // isDirty: boolean = false
  paused: boolean = false
  version: string = ""
  build: number = 0
  readCount: number = 0

  viewMode: ViewMode = ViewMode.player
  runMode: RunMode = RunMode.normal
  // Null when no ?device= parameter was given; ToolbarComponent.showExit reads
  // that distinction, so an empty-string default would not do.
  device: string | null = ""
  allInteractions = false
  userTokenId?: string

  get turned(): Combatant | null {
    for (let combatant of this.game.combatants || []) {
      if (combatant.id == this.game.combatantId) {
        return combatant
      }
    }

    return null
  }
}
