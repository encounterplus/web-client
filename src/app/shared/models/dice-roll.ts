import { graphicsUtils } from 'pixi.js';

export enum DiceRollType {
    attack = "attack",
    damage = "damage",
    heal = "heal",
    check = "check",
    save = "save"
}

export class DiceRoll {
    name: string;
    type: DiceRollType;
    formula: string;
    result: number;
    detail: string;
}