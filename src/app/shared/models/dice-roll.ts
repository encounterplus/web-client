export enum DiceRollType {
    attack = "attack",
    damage = "damage",
    heal = "heal",
    check = "check",
    save = "save"
}

export interface DiceRoll {
    name?: string;
    type?: DiceRollType;
    formula: string;
    result?: number;
    detail?: string;
}