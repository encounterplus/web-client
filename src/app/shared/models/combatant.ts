import { Initiative } from "./initiative"
import { StatusEffect } from "./status-effect"

export enum Role {
  friendly = "friendly",
  hostile = "hostile",
  neutral = "neutral",
}

export interface Combatant {
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
  effects?: Array<StatusEffect>

  bloodied?: boolean
  defeated?: boolean

  image?: string

  tokenId?: string
  entityId?: string
  entityType?: string

  player?: boolean
}

export interface ActiveCombatant {
  id: String,
  turned: boolean,
  initiative: Initiative,
  combatant: Combatant
}
