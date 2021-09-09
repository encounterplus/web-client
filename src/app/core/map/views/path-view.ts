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
        this.clear()
        
        if (this.shape) {
            this.shape.removeChild()
            this.shape.destroy()
        }

        if ((this.path?.length || 0) < 2) {
            this.shape = null
            return this
        }

        this.shape = this.grid.pathGraphics(this.path, this.gridSize, this.color)
        // if (this.gridSize.width > 1.0 || this.gridSize.height > 0) {
        //     this.gridSize.filters = [this.alphaFilter];
        //     this.shape.alpha = 1.0
        // } else {
        //     this.highlightGraphics.filters = []
        //     this.highlightGraphics.alpha = 0.3
        // }

        this.addChild(this.shape)

        return this
    }

    clear() {
        this.removeChildren()
    }
}