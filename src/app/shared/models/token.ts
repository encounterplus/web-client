import { Vision } from './vision';
import { Aura } from './aura';
import { Asset } from './asset';

export enum Role {
    friendly = "friendly",
    hostile = "hostile",
    neutral = "neutral",
}

export enum Size {
    tiny = "T",
    small = "S",
    medium = "M",
    large = "L",
    huge = "H",
    gargantuan = "G",
    colossal = "C",
}

export class Token {
    id: string
    name: string
    label: string
    role: Role
    health: number
    hitpoints: number
    x: number
    y: number
    scale: number
    size: string
    rotation: number
    elevation: number
    hidden: boolean
    reference: string
    cachedImage: string
    asset?: Asset
    vision?: Vision
    auras: Array<Aura> = []
}
