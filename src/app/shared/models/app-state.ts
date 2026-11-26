import { Screen, ScreenInteraction, SharedVision } from './screen'
import { Grid } from 'src/app/core/map/models/grid'
import { Game, emptyGame } from './game'
import { Map } from './map'
import { Combatant } from './combatant'
import { Message } from './message'
import { SquareGrid } from 'src/app/core/map/models/square-grid'
import { TrackedObject } from './tracked-object'
import { Token } from './token'
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

/**
 * Which tokens a signed-in player controls, from their session: the app decides, so the client
 * matches what it accepts.
 */
export interface TokenControl {
  playerId: string
  /** The entities the player plays in the campaign being played. */
  characterIds: string[]
}

/** The token control a session gives: only a signed-in player's. */
export function tokenControl(session: { role: string, player?: { id: string }, characters?: { id: string }[] } | null): TokenControl | undefined {
  if (session?.role !== 'player' || !session.player) {
    return undefined
  }
  return { playerId: session.player.id, characterIds: (session.characters ?? []).map(character => character.id) }
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

  /**
   * A signed-in player's tokens, decided by the app (their characters', and tokens the GM gave
   * them); undefined for guests, the GM and apps without sign-in, who control no token.
   */
  tokenControl?: TokenControl

  /**
   * Whether this client controls a token: moves it with remote interaction set to own tokens,
   * sees through it, follows it. Only a signed-in player controls any.
   */
  controls(token: Token): boolean {
    const control = this.tokenControl
    if (!control) {
      return false
    }
    if (token.controlledBy == "all") {
      return true
    }
    if (token.controlledBy) {
      // the GM's choice replaces the character's player
      return token.controlledBy == control.playerId
    }
    return token.entityId != null && control.characterIds.includes(token.entityId)
  }

  /**
   * Whether this client may open a token's entity page, such as its stat block: the GM any token's,
   * a signed-in player only a token they control.
   */
  mayShowEntity(token: Token, isGM: boolean): boolean {
    return token.reference != null && (isGM || this.controls(token))
  }

  /** The tokens on the map this client controls. */
  get ownTokens(): Token[] {
    return (this.map?.tokens ?? []).filter(token => this.controls(token))
  }

  /** The token to see through and follow: the one whose turn it is when it is ours, else the first. */
  get primaryToken(): Token | undefined {
    const own = this.ownTokens
    const turned = this.turned?.tokenId
    return own.find(token => token.id == turned) ?? own[0]
  }

  get turned(): Combatant | null {
    for (let combatant of this.game.combatants || []) {
      if (combatant.id == this.game.combatantId) {
        return combatant
      }
    }

    return null
  }
}
