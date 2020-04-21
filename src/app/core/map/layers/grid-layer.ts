import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';

export class GridLayer extends Layer {

    size: number = 50;
    offsetX: number = 0;
    offsetY: number = 0;
    color: string = '#ffffff';

    tileTexture: PIXI.Texture;
    tilingSprite: PIXI.TilingSprite;

    update(map: Map) {
        this.size = map.gridSize;
        this.offsetX = map.gridOffsetX;
        this.offsetY = map.gridOffsetY;
        this.color = map.gridColor;
        this.visible = map.gridVisible;
    }

    _drawLine(points, lineColor, lineAlpha) {
        let line = new PIXI.Graphics();
        line.lineStyle(1, lineColor, lineAlpha, 0.5, false)
            .moveTo(points[0], points[1])
            .lineTo(points[2], points[3]);
        return line;
      }

    async draw() {

        return;

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


        let width = this.parent.width;
        let height = this.parent.height;

        // columns
        let cols = Math.floor(width / this.size);
        for (let i = 0; i < cols; i++) {
            let x = (i * this.size) + this.offsetX;
            this.addChild(this._drawLine([x, 0, x, height], PIXI.utils.string2hex(this.color), 1));
        }

        // rows
        let rows = Math.ceil(height / this.size);
        for (let i = 0; i < rows; i++) {
            let y = (i * this.size) + this.offsetY;
            this.addChild(this._drawLine([0, y, width, y], PIXI.utils.string2hex(this.color), 1));
        }

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

        return this;
    }

    clear() {
        this.tileTexture = null;
        this.tilingSprite = null;
    }

}