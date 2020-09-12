import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { Grid } from '../models/grid';

export class GridLayer extends Layer {
    grid: Grid;
    highlightPath: Array<number> = [];
    highlightScale: number = 1.0;
    highlightColor: number = 0xffffff;
    highlightGraphics: PIXI.Graphics = new PIXI.Graphics();

    alphaFilter = new PIXI.filters.AlphaFilter();

    constructor() {
        super();
        this.alphaFilter.alpha = 0.5;
    }

    update(grid: Grid) {
        this.grid = grid;
    }

    updateHighlight(path: Array<number>, scale: number, color: number) {
        this.highlightPath = path;
        this.highlightScale = Math.max(scale, 1.0);
        this.highlightColor = color;

        if (scale > 1.0) {
            this.highlightGraphics.filters = [this.alphaFilter];
            this.highlightGraphics.alpha = 1.0;
        } else {
            this.highlightGraphics.filters = [];
            this.highlightGraphics.alpha = 0.5;
        }
    }

    pointForPosition(x: number, y: number): PIXI.Point {
        return new PIXI.Point((x * this.grid.size) + this.grid.offsetX, (y * this.grid.size) + this.grid.offsetY);
    }

    async drawHighlight() {

        this.highlightGraphics.clear();
        this.highlightGraphics.beginFill(this.highlightColor);

        for (let i = 0; i < this.highlightPath.length; i=i+2) {
            let x = this.highlightPath[i];
            let y = this.highlightPath[i + 1];

            let point = this.pointForPosition(x, y);

            this.highlightGraphics.drawRect(point.x, point.y, this.grid.size * this.highlightScale, this.grid.size * this.highlightScale);
        }

        this.highlightGraphics.endFill();
        return this;
    }

    async drawGrid() {
        
        let width = this.w * this.grid.scale;
        let height = this.h * this.grid.scale;

        // columns
        let cols = Math.floor((width + this.grid.size*.9)/ this.grid.size);
        for (let i = 0; i < cols; i++) {
            let x = (i * this.grid.size) + this.grid.offsetX;
            if (x<=width) this.addChild(this._drawLine([x, 0, x, height], PIXI.utils.string2hex(this.grid.color), 0.8));
        }

        // rows
        let rows = Math.ceil((height + this.grid.size*.9)/ this.grid.size);
        for (let i = 0; i < rows; i++) {
            let y = (i * this.grid.size) + this.grid.offsetY;
            if (y<=height) this.addChild(this._drawLine([0, y, width, y], PIXI.utils.string2hex(this.grid.color), 0.8));
        }

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

    _drawLine(points, lineColor, lineAlpha) {
        let line = new PIXI.Graphics();
        line.lineStyle(1.0, lineColor, lineAlpha, 0.5, false)
            .moveTo(points[0], points[1])
            .lineTo(points[2], points[3]);
        return line;
    }

    clear() {
        this.removeChildren();
    }

}
