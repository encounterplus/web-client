import { Vision } from './vision';
import { Aura } from './aura';
import { Asset } from './asset';
import { GridSize } from 'src/app/core/map/views/token-view';

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

export enum TokenStyle {
    circle = "circle",
    topdown = "topdown",
}

export namespace Size {
    export function toGridSize(size: String): GridSize {
        if (size == '') {
            return {width: 1, height: 1}
        } else if (size.includes('x')) {
            let parts = size.split("x")
            return {width: Number(parts[0]), height: Number(parts[1])}
        } else {
            switch (size) {
                case Size.large: {
                    return {width: 2, height: 2}
                }
                case Size.huge: {
                    return {width: 3, height: 3}
                }  
                case Size.gargantuan: {
                    return {width: 4, height: 4}
                }
                case Size.colossal: {
                    return {width: 6, height: 6}
                }
                default: {
                    return {width: 1, height: 1}
                }      
            }
        }
    }
}

export class Token {
    id: string
    name?: string
    label?: string
    role: Role
    health?: number
    hitpoints?: number
    bloodied: boolean
    dead: boolean
    x: number
    y: number
    scale: number
    size: string
    style?: TokenStyle
    rotation: number
    elevation: number
    hidden: boolean
    reference?: string
    cachedImage?: string
    cachedImageToken?: boolean
    asset?: Asset
    vision?: Vision
    auras: Array<Aura> = []
    trackingId?: number
}
