import { Vision } from './vision';
import { Light } from './light';
import { Aura } from './aura';

export enum Role {
    friendly = "friendly",
    hostile = "hostile",
    neutral = "neutral",
}

export class Creature {
    id: string
    uid: string
    type: string
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
    player: boolean
}
