import { Vision } from './vision';
import { Light } from './light';
import { Aura } from './aura';

export enum Role {
    friendly = "friendly",
    hostile = "hostile",
    neutral = "neutral",
}

export enum CreatureType {
    monster = "monster",
    player = "player",
    npc = "npc"
}

export class Creature {
    id: string;
    uid: string;
    type: CreatureType;
    name: string;
    role: Role;
    rank: number;
    initiative: number;
    health: number;
    hitpoints: number;
    bloodied: boolean;
    dead: boolean;
    hidden: boolean;
    image: string;
    token: string;
    mapId: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
    cachedToken: string;
    vision: Vision;
    light: Light;
    auras: Array<Aura> = [];
}
