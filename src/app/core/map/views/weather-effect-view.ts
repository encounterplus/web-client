import { View } from './view';
import { Grid } from '../models/grid';
import * as particles from "pixi-particles";
import * as PIXI from 'pixi.js'
import { Layer } from '../layers/layer';
import { WeatherType } from 'src/app/shared/models/map';

export class WeatherEffectView extends View {

    weatherEffect: String;
    particleTexture: PIXI.Texture;

    emitter: particles.Emitter;

    snowConfig() : any {
        const scale = (this.grid.size / 64.0) * 0.15;
        const edge =  Math.max(this.w, this.h) * 1.2

        const intensity = this.intensity

        let config = {
            alpha: {
                start: 0.9,
                end: 0,
                minimumAlphaMultiplier: 0.8,
            },
            scale: {
                start: scale,
                end: scale * 0.6,
                minimumScaleMultiplier: 0.8,
            },
            color: {
                start: "#ffffff",
                end: "#ffffff"
            },
            speed: {
                start: 100 * (intensity <= 1 ? 1.0 : intensity**3),
                end: 90 * (intensity <= 1 ? 1.0 : intensity**3),
                minimumSpeedMultiplier: 0.9,
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 0,
            startRotation: {
                min: 170,
                max: 195
            },
            noRotation: !1,
            rotationSpeed: {
                min: 0,
                max: 5
            },
            lifetime: {
                min: 1.0,
                max: 1.5
            },
            blendMode: "normal",
            frequency: 1 / (300 * (intensity <= 1 ? intensity : intensity**3 )),
            emitterLifetime: -1,
            maxParticles: 3000,
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
                minR: edge * 0.05 * intensity
            }
        };

        return config
    }

    rainConfig() : any {
        const scale = (this.grid.size / 64.0) * 0.3;
        const edge =  Math.max(this.w, this.h) * 1.2

        const intensity = this.intensity

        let config = {
            alpha: {
                start: 0.5,
                end: 0.0,
                minimumAlphaMultiplier: 0.8,
            },
            scale: {
                start: scale,
                end: scale * 0.9,
                minimumScaleMultiplier: 0.9,
            },
            color: {
                start: "#ffffff",
                end: "#ffffff"
            },
            speed: {
                start: 1200 * (intensity <= 1 ? 1.0 : intensity**2),
                end: 1200 * (intensity <= 1 ? 1.0 : intensity**2),
                minimumSpeedMultiplier: 0.9,
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 0,
            startRotation: {
                min: 70,
                max: 70
            },
            noRotation: !1,
            rotationSpeed: {
                min: 0,
                max: 0
            },
            lifetime: {
                min: 0.7,
                max: 1.1
            },
            blendMode: "normal",
            frequency: 1 / (500 * intensity),
            emitterLifetime: -1,
            maxParticles: 3000,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: 'rect',
            spawnRect: {
                x: this.w - (this.w * 1.2),
                y: 0,
                w: this.w * 1.2,
                h: this.h
            }
        };

        return config
    }

    fogConfig() : any {
        const scale = (this.grid.size / 400.0) * 20;
        const edge =  Math.max(this.w, this.h) * 1.2
        const intensity = this.intensity

        let config = {
            alpha: {
                list: [
                    {
                        value: 0,
                        time: 0
                    },
                    {
                        value: 0.1,
                        time: 0.1
                    },
                    {
                        value: 0.0,
                        time: 1
                    }
                ],
                isStepped: false
            },
            scale: {
                start: scale,
                end: scale * 1.1,
                minimumScaleMultiplier: 1.4,
            },
            color: {
                start: "#ffffff",
                end: "#ffffff"
            },
            speed: {
                start: 100 * (intensity <= 1 ? 1.0 : intensity),
                end: 100 * (intensity <= 1 ? 1.0 : intensity),
                minimumSpeedMultiplier: 0.8,
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 0,
            startRotation: {
                min: 0,
                max: 0
            },
            rotationSpeed: {
                min: 2,
                max: 5
            },
            lifetime: {
                min: 10,
                max: 20
            },
            blendMode: "normal",
            frequency: 1 / (0.7 * (intensity <= 1 ? 1.0 : intensity**3 )),
            emitterLifetime: -1,
            maxParticles: 2000,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: 'rect',
            spawnRect: {
                x: this.w - (this.w * 1.2),
                y: 0,
                w: this.w,
                h: this.h * 1.2
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
                config = this.fogConfig()
                break
            case WeatherType.rain:
                config = this.rainConfig()
                break
            case WeatherType.snow:
                config = this.snowConfig()
                break
        }
        

        this.emitter = new particles.Emitter(parentLayer, texture, config)
        this.emitter.particleBlendMode = PIXI.BLEND_MODES.ADD
        
        // // this.emitter.update((Date.now() + 1000));
        // this.emitter.autoUpdate = true;

        // advance for 10 seconds
        this.emitter.autoUpdate = false;
        this.emitter.update((10));
        this.emitter.autoUpdate = true;

        

        // this.pointer = pointer
        this.grid = grid
    }

    updatePosition(x: number, y: number) {
        this.emitter.updateOwnerPos(x, y);
    }
}