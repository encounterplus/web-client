import { Layer } from './layer';
import { DataService } from 'src/app/shared/services/data.service';
import { Drawing, DrawingShape } from 'src/app/shared/models/drawing';
import { Graphics } from 'pixi.js';
import { MapLayer } from 'src/app/shared/models/map';

export class DrawingsLayer extends Layer {
    drawings: Array<Drawing> = [];
    views: Array<Graphics> = [];

    constructor(private dataService: DataService) {
        super();
    }

    update() {
        this.drawings = this.dataService.state.map?.drawings || [];
    }

    async draw() {
        this.clear();

        // drawings
        for (let drawing of this.drawings) {
            // skip walls (legacy drawings) and dm layer
            if (drawing.layer == MapLayer.dm || drawing.layer == MapLayer.wall) {
                continue;
            }

            let graphics = new PIXI.Graphics();

            switch (drawing.shape) {
                case DrawingShape.ellipse:
                    graphics.lineStyle(drawing.strokeWidth, PIXI.utils.string2hex(drawing.strokeColor));
                    graphics.drawEllipse(drawing.data[0], drawing.data[1], drawing.data[2], drawing.data[3])
                    
                    break;

                default:
                    // deprecated
                    // graphics.lineStyle(drawing.strokeWidth, PIXI.utils.string2hex(drawing.strokeColor));

                    // wtf? pixi.js.d.ts not updated for line style? ignoring error and force new options...
                    // @ts-ignore
                    graphics.lineStyle({width: drawing.strokeWidth, color: PIXI.utils.string2hex(drawing.strokeColor), cap: PIXI.LINE_CAP.ROUND, join: PIXI.LINE_JOIN.ROUND})

                    for(let i = 0; i < (drawing.data.length); i = i + 2) {
                        if (i == 0) {
                            graphics.moveTo(drawing.data[0], drawing.data[1])
                        } else {
                            graphics.lineTo(drawing.data[i], drawing.data[i + 1])
                        }
                    }
                    
                    break;
            }

            graphics.cacheAsBitmap = true;

            if (drawing.opacity < 1.0) {
                let container = new PIXI.Container();
                container.addChild(graphics);
                container.alpha = drawing.opacity;

                this.addChild(container);
            } else {
                this.addChild(graphics);
            }
        }

        return this;
    }

    async drawDrawing() {

    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}