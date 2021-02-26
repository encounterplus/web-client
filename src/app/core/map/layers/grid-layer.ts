import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { Grid } from '../models/grid';
import { GridSize } from '../views/token-view';

export class GridLayer extends Layer {
    grid: Grid;
    highlightPath: Array<number> = []
    highlightSize: GridSize
    highlightColor: number = 0xffffff
    highlightGraphics: PIXI.Graphics = new PIXI.Graphics()

    alphaFilter = new PIXI.filters.AlphaFilter();

    constructor() {
        super();
        this.alphaFilter.alpha = 0.5;
    }

    update(grid: Grid) {
        this.grid = grid;
    }

    updateHighlight(path: Array<number>, gridSize: GridSize, color: number) {
        this.highlightPath = path
        this.highlightSize = gridSize
        this.highlightColor = color
    }

    pointForPosition(x: number, y: number): PIXI.Point {
        return new PIXI.Point((x * this.grid.size) + this.grid.offsetX, (y * this.grid.size) + this.grid.offsetY);
    }

    async drawHighlight() {

        if (this.highlightGraphics) {
            this.highlightGraphics.removeChild()
            this.highlightGraphics.destroy()
        }

        this.highlightGraphics = this.grid.pathGraphics(this.highlightPath, this.highlightSize, this.highlightColor)
        if (this.highlightSize.width > 1.0 || this.highlightSize.height > 0) {
            this.highlightGraphics.filters = [this.alphaFilter];
            this.highlightGraphics.alpha = 1.0
        } else {
            this.highlightGraphics.filters = []
            this.highlightGraphics.alpha = 0.5
        }

        this.addChild(this.highlightGraphics)

        return this;
    }

    async drawGrid() {
        this.addChild(this.grid.gridGraphics(this.w, this.h))
        return this;
    }

    async draw() {
        this.removeChildren()
        this.addChild(this.highlightGraphics);

        if (this.grid.visible) {
            await this.drawGrid();
        }

        if (this.highlightPath.length > 0) {
            await this.drawHighlight();
        }

        return this;
    }

    clear() {
        this.removeChildren();
    }

}
