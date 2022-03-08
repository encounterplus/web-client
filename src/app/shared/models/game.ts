import { Creature } from './creature';

export class Game {
    turn: number;
    round: number;
    started: boolean;
    creatures: Array<Creature> = [];
}
