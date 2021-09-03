import * as PIXI from 'pixi.js'
import { GridStyle, GridType, Map } from 'src/app/shared/models/map';
import { GridSize } from '../views/token-view';

export interface GridInterface {
    size: number
    offsetX: number
    offsetY: number
    color: string
    visible: boolean
    opacity: number
    style: GridStyle
    type: GridType
    scale: number
    units: string

    gridGraphics(width: number, height: number): PIXI.Graphics
}

export abstract class Grid implements GridInterface {
    size: number = 50
    offsetX: number = 0
    offsetY: number = 0
    color: string = '#cccccc'
    visible: boolean = true
    opacity: number = 1.0
    style: GridStyle = GridStyle.solid
    type: GridType = GridType.square
    scale: number = 5.0
    units: string = 'ft'

    update(map: Map) {
        this.size = map.gridSize
        this.offsetX = map.gridOffsetX
        this.offsetY = map.gridOffsetY
        this.color = map.gridColor
        this.opacity = map.gridOpacity
        this.visible = map.gridVisible
        this.scale = map.gridScale
        this.units = map.gridUnits
        this.type = map.gridType
    }
    
    abstract get blockSize(): PIXI.ISize
    abstract get adjustedSize(): PIXI.ISize
    abstract get pixelRatio(): number
    abstract position(x: number, y: number): PIXI.Point
    abstract gridGraphics(width: number, height: number): PIXI.Graphics
    abstract pathGraphics(path: Array<number>, gridSize: GridSize, color: number): PIXI.Graphics
    abstract sizeFromGridSize(gridSize: GridSize): PIXI.ISize
   
}
