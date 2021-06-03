import { View } from './view';
import { Grid } from '../models/grid';
import * as particles from "pixi-particles";
import * as PIXI from 'pixi.js'
import { Layer } from '../layers/layer';

export class WeatherEffectView extends View {

    grid: Grid;
    weatherEffect: String;
    particleTexture: PIXI.Texture;

    emitter: particles.Emitter;

    constructor(weatherEffect: String, grid: Grid, parent: Layer, texture: PIXI.Texture) {
        super();

        let particleScale = (grid.size / 64.0) * 0.8;

        let config = {
            alpha: {
                start: .6,
                end: 0,
                minimumAlphaMultiplier: 1,
                maximumAlphaMultiplier: 2
            },
            scale: {
                start: .4,
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
            frequency: 5e-4,
            emitterLifetime: -1,
            maxParticles: 400,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: false,
            spawnType: 'ring',
            spawnCircle: {
                x: parent.w / 2,
                y: parent.h / 2,
                r: parent.w * 0.6,
                minR: parent.h * 0.2
            }
        };

        this.emitter = new particles.Emitter(parent, texture, config);
        this.emitter.autoUpdate = true;
        // this.emitter.particleBlendMode = PIXI.BLEND_MODES.ADD;

        // this.pointer = pointer
        this.grid = grid
    }

    updatePosition(x: number, y: number) {
        this.emitter.updateOwnerPos(x, y);
    }
}