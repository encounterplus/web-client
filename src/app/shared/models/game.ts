import { Combatant } from './combatant';

export class Game {
    turn: number
    round: number
    started: boolean
    combatantId?: string
    initiativeId?: string
    combatants: Array<Combatant> = []
}
