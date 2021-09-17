import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Measurement } from 'src/app/shared/models/measurement';
import { GridSize } from './token-view';

export class PathView extends View {
    shape?: PIXI.Graphics
    handles: PIXI.Graphics

    public path: Array<number>
    public gridSize: GridSize
    public color: number

    constructor(private grid: Grid) {
        super()
    }

    async draw() {
        // create new shape
        if (!this.shape) {
            this.shape = new PIXI.Graphics()
            this.addChild(this.shape)
        }

        // visibility
        if ((this.path?.length || 0) < 2) {
            this.shape.visible = false
            return this
        } else {
            this.shape.visible = true
        }

        // path shape
        this.shape = this.grid.pathGraphics(this.path, this.gridSize, this.color, this.shape)
        return this
    }

    clear() {
        this.removeChildren()
    }
}