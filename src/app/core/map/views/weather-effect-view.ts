import { View } from './view';
import { Grid } from '../models/grid';
import * as particles from "pixi-particles";
import * as PIXI from 'pixi.js'
import { Layer } from '../layers/layer';
import { WeatherType } from 'src/app/shared/models/map';
import { NgbTypeaheadWindow } from '@ng-bootstrap/ng-bootstrap/typeahead/typeahead-window';

export class WeatherEffectView extends View {

    weatherEffect: String;
    particleTexture: PIXI.Texture;

    emitter: particles.Emitter;

    snowConfig() : any {
        const scale = (this.grid.size / 64.0) * 0.15;
        const edge =  Math.max(this.w, this.h) * 1.2

        const intensity = this.intensity
        const intensity2 = this.intensity * this.intensity
        const intensity3 = this.intensity * this.intensity * this.intensity
        const intensity4 = this.intensity * this.intensity * this.intensity * this.intensity


        let config = {
            alpha: {
                start: .8,
                end: 0,
                minimumAlphaMultiplier: 1,
                maximumAlphaMultiplier: 2
            },
            scale: {
                start: scale,
                end: 0,
                minimumScaleMultiplier: 1,
                maximumScaleMultiplier: 2
            },
            color: {
                start: "#ffffff",
                end: "#ffffff"
            },
            speed: {
                start: 200,
                end: 240,
                minimumSpeedMultiplier: 2.5
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 0,
            startRotation: {
                min: 180,
                max: 180
            },
            noRotation: !1,
            rotationSpeed: {
                min: 0,
                max: 0
            },
            lifetime: {
                min: 1.5,
                max: 2.5
            },
            blendMode: "normal",
            frequency: 1 / (300 * (intensity <= 1 ? intensity : intensity4 )),
            emitterLifetime: -1,
            maxParticles: 2000,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: 'ring',
            spawnCircle: {
                x: this.w / 2,
                y: this.h / 2,
                r: edge / 2,
                minR: edge * 0.15
            }
        };

        return config
    }

    constructor(type: WeatherType, private intensity: number, private grid: Grid, private parentLayer: Layer, texture: PIXI.Texture) {
        super();

        this.w = parentLayer.w
        this.h = parentLayer.h
        
        let config: particles.EmitterConfig | particles.OldEmitterConfig;

        switch(type) {
            case WeatherType.fog:
                config = this.snowConfig()
                break
            case WeatherType.rain:
                config = this.snowConfig()
                break
            case WeatherType.snow:
                config = this.snowConfig()
                break
        }
        

        this.emitter = new particles.Emitter(parentLayer, texture, config);
        this.emitter.autoUpdate = true;
        // this.emitter.particleBlendMode = PIXI.BLEND_MODES.ADD;

        // this.pointer = pointer
        this.grid = grid
    }

    updatePosition(x: number, y: number) {
        this.emitter.updateOwnerPos(x, y);
    }
}