import { Combatant } from './combatant';

export class Game {
    turn: number = 0
    round: number = 0
    started: boolean = false
    combatantId?: string
    initiativeId?: string
    combatants: Array<Combatant> = []
}
