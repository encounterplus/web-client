import { Sight } from "./sight"

export interface Light {
    id: string
    enabled: boolean
    radiusMin: number
    radiusMax: number
    color: string
    opacity: number
    alwaysVisible: boolean
    x: number
    y: number
    sight?: Sight
}