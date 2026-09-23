import { Combatant } from './combatant';

export interface Game {
    turn: number
    round: number
    started: boolean
    combatantId?: string
    initiativeId?: string
    combatants: Array<Combatant>
}

export function emptyGame(): Game {
    return {
        turn: 0,
        round: 0,
        started: false,
        combatants: [],
    }
}
