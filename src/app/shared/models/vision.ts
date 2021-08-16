import { Sight } from "./sight"

export enum VisionType {
    light = "light",
    dark = "dark",
    combined = "combined",
}

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