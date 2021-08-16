import * as PIXI from 'pixi.js'
import { Layer } from './layer';
import { ControlState } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';

import { Loader } from '../models/loader';
import { Pointer } from 'src/app/shared/models/pointer';
import { PointerView } from '../views/pointer-view';
import { WeatherEffectView } from '../views/weather-effect-view';
import { WeatherType } from 'src/app/shared/models/map';
import { FocusView } from '../views/focus-view';

export class EffectsLayer extends Layer {
    grid: Grid;

    constructor(private dataService:DataService) {
        super()
    }

    ringTexture: PIXI.Texture
    snowTexture: PIXI.Texture
    rainTexture: PIXI.Texture
    fogTexture: PIXI.Texture
    circleTexture: PIXI.Texture

    views = {};

    weatherEffectView: WeatherEffectView

    async draw() {

        // this.clear();
        // this.w = this.parent.width;
        // this.h = this.parent.height;

        if (!this.ringTexture) {
            this.ringTexture = await Loader.shared.loadTexture('/assets/img/particle.png', true);
        }

        if (!this.snowTexture) {
            this.snowTexture = await Loader.shared.loadTexture('/assets/img/snow.png', true);
        }

        if (!this.rainTexture) {
            this.rainTexture = await Loader.shared.loadTexture('/assets/img/rain.png', true);
        }

        if (!this.fogTexture) {
            this.fogTexture = await Loader.shared.loadTexture('/assets/img/smoke.png', true);
        }

        if (!this.circleTexture) {
            this.circleTexture = await Loader.shared.loadTexture('/assets/img/circle.png', true);
        }

        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);

        if (this.weatherEffectView != null) {
            this.weatherEffectView.emitter.emit = false;
            this.weatherEffectView.emitter.destroy()
            this.weatherEffectView.destroy()
            this.removeChild(this.weatherEffectView)
            this.weatherEffectView = null
        }

        const weatherType = this.dataService.state.map.weatherType
        const weatherIntensity = this.dataService.state.map.weatherIntensity
        let particleTexture: PIXI.Texture
    
        if (weatherType != null && weatherType != WeatherType.none) {
            console.debug("creating weather effect: " + weatherType)

            switch(weatherType) {
                case WeatherType.fog:
                    particleTexture = this.fogTexture
                    break
                case WeatherType.rain:
                    particleTexture = this.rainTexture
                    break
                case WeatherType.snow:
                    particleTexture = this.snowTexture
                    break
            }

            this.weatherEffectView = new WeatherEffectView(weatherType, weatherIntensity, this.grid, this, particleTexture);
            this.weatherEffectView.updatePosition(0, 0);
            this.weatherEffectView.emitter.emit = true;
            this.addChild(this.weatherEffectView);
        }
        
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

    async drawFocus(x: number, y: number, color: string) {
        
         // console.log("creating new focus");
        let focusView = new FocusView(color, this.grid, this, this.circleTexture);
        focusView.updatePosition(x, y);
        focusView.emitter.emit = true;
        focusView.emitter.playOnceAndDestroy( () => {
                // console.log('destroying pointer');
        });
        this.addChild(focusView);
    }

    clear() {
        this.removeChildren();
    }
}