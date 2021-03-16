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
}

export class Creature {
    id: string
    uid: string
    type: CreatureType
    name: string
    role: Role
    rank: number
    initiative: number
    health: number
    hitpoints: number
    bloodied: boolean
    dead: boolean
    hidden: boolean
    tokenId?: string
    image?: string
}
