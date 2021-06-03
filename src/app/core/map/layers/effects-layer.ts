import * as PIXI from 'pixi.js'
import { Layer } from './layer';
import { ControlState } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';

import { Loader } from '../models/loader';
import { Pointer } from 'src/app/shared/models/pointer';
import { PointerView } from '../views/pointer-view';
import { isNumericLiteral } from 'typescript';
import { WeatherEffectView } from '../views/weather-effect-view';

export class EffectsLayer extends Layer {
    grid: Grid;

    constructor(private dataService:DataService) {
        super();
    }

    ringTexture: PIXI.Texture;
    snowTexture: PIXI.Texture;
    rainTexture: PIXI.Texture;

    views = {};

    async draw() {

        // this.clear();
        this.w = this.parent.width;
        this.h = this.parent.height;

        if (!this.ringTexture) {
            this.ringTexture = await Loader.shared.loadTexture('/assets/img/particle.png', true);
        }

        // if (!this.snowTexture) {
        //     this.snowTexture = await Loader.shared.loadTexture('/assets/img/snow.png', true);
        // }

        // if (!this.rainTexture) {
        //     this.rainTexture = await Loader.shared.loadTexture('/assets/img/rain.png', true);
        // }

        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);

        // let weatherEffectView = new WeatherEffectView("snow", this.grid, this, this.rainTexture);
        // weatherEffectView.updatePosition(0, 0);
        // weatherEffectView.emitter.emit = true;
        // this.addChild(weatherEffectView);

        return this;
    }

    pointerViewById(id: string): PointerView {
        return this.views[id];
    }

    async drawPointer(pointer: Pointer) {
        var pointerView = this.pointerViewById(pointer.id);
        if (pointerView) {
            pointerView.updatePosition(pointer.x, pointer.y);
        } else {
            // console.log("creating new pointer");
            pointerView = new PointerView(pointer, this.grid, this, this.ringTexture);
            pointerView.updatePosition(pointer.x, pointer.y);
            pointerView.emitter.emit = true;
            pointerView.emitter.playOnceAndDestroy( () => {
                // console.log('destroying pointer');
            });
            this.addChild(pointerView);
            this.views[pointer.id] = pointerView;
        }

        switch(pointer.state) {
            case ControlState.control: {
                break;
            }

            case ControlState.end:
            case ControlState.cancel:
                pointerView.emitter.emit = false;
                delete this.views[pointer.id];
                pointerView.destroy();
                break;
        }
    }

    clear() {
        this.removeChildren();
    }
}