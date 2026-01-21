import { Screen } from './screen'
import { Grid } from 'src/app/core/map/models/grid'
import { Game } from './game'
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

export class AppState {
  map?: Map
  game: Game = new Game()
  screen: Screen = new Screen()
  messages: Array<Message> = []
  trackedObjects: Array<TrackedObject> = []
  grid: Grid = new SquareGrid()
  // isDirty: boolean = false
  paused: boolean = false
  version: string
  build: number
  readCount: number

  viewMode: ViewMode = ViewMode.player
  runMode: RunMode = RunMode.normal
  device: string = ""
  allInteractions = false
  userTokenId?: string

  get turned(): Combatant {
    for (let combatant of this.game.combatants || []) {
      if (combatant.id == this.game.combatantId) {
        return combatant
      }
    }

    return null
  }
}
