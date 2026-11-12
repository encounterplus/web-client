export enum DiceRollType {
    attack = "attack",
    damage = "damage",
    heal = "heal",
    check = "check",
    save = "save"
}

/** What the game system reads from a roll's labelled dice: Daggerheart's "With Hope". */
export interface DiceRollOutcome {
    id: string;
    label: string;
    color?: string;
}

export interface DiceRoll {
    name?: string;
    type?: DiceRollType;
    formula: string;
    result?: number;
    detail?: string;
    outcome?: DiceRollOutcome;
}