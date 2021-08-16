import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import * as particles from "pixi-particles";

export class FocusView extends View {

    grid: Grid;
    particleTexture: PIXI.Texture;
    sourceText: PIXI.Text;

    emitter: particles.Emitter;

    constructor(private color: string, grid: Grid, parent: PIXI.Container, texture: PIXI.Texture) {
        super();

        let particleScale = (grid.size / 480.0) * 6;

        let config = {
            alpha: {
                start: 1,
                end: 0,
            },
            scale: {
                start: 0,
                end: 1.0 * particleScale
            },
            color: {
                start: this.color,
                end: this.color
            },
            speed: {
                start: 0,
                end: 0
            },
            acceleration: {
                x: 0,
                y: 0
            },
            maxSpeed: 100,
            startRotation: {
                min: 0,
                max: 360
            },
            noRotation: true,
            rotationSpeed: {
                min: 100,
                max: 100
            },
            lifetime: {
                min: 2,
                max: 2
            },
            frequency: 0.75,
            emitterLifetime: 3,
            maxParticles: 500,
            pos: {
                x: 0,
                y: 0
            },
            addAtBack: true,
            spawnType: "point"
        };

        this.emitter = new particles.Emitter(parent, texture, config);
        this.emitter.autoUpdate = true;
        // this.emitter.particleBlendMode = PIXI.BLEND_MODES.ADD;
    }

    updatePosition(x: number, y: number) {
        this.emitter.updateOwnerPos(x, y);
    }
}