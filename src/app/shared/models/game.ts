import { Combatant } from './combatant';

/**
 * A game resource the table spends and accumulates, such as Daggerheart's Fear, as the app sends
 * it: the system's definition resolved with the current value. Only resources the system shows to
 * players are ever sent.
 */
export interface GameResource {
    id: string
    /**
     * `counter`, or `countdown` — which the app only sends while its value is not 0. A client
     * skips a type it does not know.
     */
    type: string
    label: string
    /** A `gi-` game icon name, or an image path on the server. */
    icon?: string
    min: number
    /** Absent when the resource has no upper limit. */
    max?: number
    value: number
}

export interface Game {
    turn: number
    round: number
    started: boolean
    combatantId?: string
    initiativeId?: string
    combatants: Array<Combatant>
    /** Absent from servers that predate game resources. */
    resources?: Array<GameResource>
}

export function emptyGame(): Game {
    return {
        turn: 0,
        round: 0,
        started: false,
        combatants: [],
    }
}
