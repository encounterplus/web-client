import { Sight } from "./sight"

export class Vision {
    id: string;
    enabled: boolean
    light: boolean
    lightRadiusMin: number
    lightRadiusMax: number
    lightColor: string
    lightOpacity: number
    dark: boolean
    darkRadiusMin: number
    darkRadiusMax: number
    sight?: Sight
}