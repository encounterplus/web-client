import { Initiative } from "./initiative"

export enum Role {
    friendly = "friendly",
    hostile = "hostile",
    neutral = "neutral",
}

export class Combatant {
    id: string
    label?: string
    name?: string
    role?: Role
    hidden?: boolean
    reference?: string

    data?: any
    attributes?: any

    rank: number
    initiative?: Array<Initiative>

    bloodied?: boolean
    defeated?: boolean

    image?: string
    
    tokenId?: string
    entityId?: string
    entityType?: string
}

export interface ActiveCombatant {
  id: String,
  turned: boolean,
  initiative: Initiative,
  combatant: Combatant
}
