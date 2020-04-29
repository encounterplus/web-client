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

        // const colorMatrix = new PIXI.filters.AlphaFilter();
        this.alphaFilter.alpha = 0.5;
        // this.highlightGraphics.filters = [colorMatrix];

    }

    update(grid: Grid) {
        this.grid = grid;
    }

    updateHighlight(path: Array<number>, scale: number, color: number) {
        this.highlightPath = path;
        this.highlightScale = scale;
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
        let width = this.parent.width;
        let height = this.parent.height;

        // columns
        let cols = Math.floor(width / this.grid.size);
        for (let i = 0; i < cols; i++) {
            let x = (i * this.grid.size) + this.grid.offsetX;
            this.addChild(this._drawLine([x, 0, x, height], PIXI.utils.string2hex(this.grid.color), 1));
        }

        // rows
        let rows = Math.ceil(height / this.grid.size);
        for (let i = 0; i < rows; i++) {
            let y = (i * this.grid.size) + this.grid.offsetY;
            this.addChild(this._drawLine([0, y, width, y], PIXI.utils.string2hex(this.grid.color), 1));
        }

        return this;

        // canvas drawing

        // const canvas = document.createElement('canvas');
        // canvas.width  = this.size;
        // canvas.height = this.size;

        // let context = canvas.getContext('2d');
        // context.beginPath();
        // context.moveTo(this.size, 0);
        // context.lineTo(0, 0);
        // context.lineTo(0, this.size);
        // context.lineWidth = 1; //  1 / (window.devicePixelRatio || 1);
        // context.strokeStyle = this.color;
        // context.stroke();

        // let width = this.parent.width;
        // let height = this.parent.height;

        // this.tileTexture = PIXI.Texture.from(canvas);
        // this.tilingSprite = this.addChild(new PIXI.TilingSprite(this.tileTexture, width + this.size, height + this.size));
        // this.tilingSprite.x = this.offsetX - this.size;
        // this.tilingSprite.y = this.offsetY - this.size;

        // this.cacheAsBitmap = true;
        

        // this.scale.set(0.5);

        // console.debug(this.width);
        // console.debug(this.tilingSprite);

        // const graphics = new PIXI.Graphics();

        // // Rectangle
        // graphics.beginFill(0xDE3249);
        // graphics.drawRect(50, 50, 100, 100);
        // graphics.endFill();

        // // Rectangle + line style 1
        // graphics.lineStyle(2, 0xFEEB77, 1);
        // graphics.beginFill(0x650A5A);
        // graphics.drawRect(200, 50, 100, 100);
        // graphics.endFill();

        // // draw polygon
        // const path = [600, 370, 700, 460, 780, 420, 730, 570, 590, 520];

        // graphics.lineStyle(0);
        // graphics.beginFill(0x3500FA, 1);
        // graphics.drawPolygon(path);
        // graphics.endFill();

        // this.addChild(graphics);
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
        line.lineStyle(1, lineColor, lineAlpha, 0.5, false)
            .moveTo(points[0], points[1])
            .lineTo(points[2], points[3]);
        return line;
    }

    clear() {
        this.removeChildren();
    }

}