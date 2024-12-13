import { Component } from "@angular/core"

export class Asset {
    id: string
    name: string
    type: string
    resource: string
    scale: number
    offsetX: number
    offsetY: number
    frameWidth: number
    frameHeight: number
    duration: number
    components?: Array<Component>
}
