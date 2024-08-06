import { Combatant } from './combatant';

export class Game {
    turn: number;
    round: number;
    started: boolean;
    creatures: Array<Combatant> = [];
}
