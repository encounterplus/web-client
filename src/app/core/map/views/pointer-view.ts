import { View } from './view';
import { Grid } from '../models/grid';
import * as particles from "pixi-particles";
import { Pointer } from 'src/app/shared/models/pointer';

export class PointerView extends View {

    grid: Grid;
    pointer: Pointer
    particleTexture: PIXI.Texture;

    sourceText: PIXI.Text;

    emitter: particles.Emitter;

    constructor(pointer: Pointer, grid: Grid, parent: PIXI.Container, texture: PIXI.Texture) {
        super();

        let particleScale = (grid.size / 64.0) * 0.8;

        let config = {
            alpha: {
                start: 1,
                end: 0,
            },
            scale: {
                start: 1.0 * particleScale,
                end: 0.8 * particleScale
            },
            color: {
                start: pointer.color,
                end: pointer.color
            },
            speed: {
                start: 20,
                end: 30
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
            noRotation: false,
            rotationSpeed: {
                min: 100,
                max: 100
            },
            lifetime: {
                min: 1,
                max: 4
            },
            frequency: 0.05,
            emitterLifetime: 60,
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
        this.emitter.particleBlendMode = PIXI.BLEND_MODES.ADD;

        this.pointer = pointer;
        this.grid = grid;

        // create source label
        this.sourceText = new PIXI.Text(this.pointer.source || "Unknown", {fontFamily : 'Arial', fontSize: 30, fill : 0xffffff, align : 'center', dropShadow: true,
        dropShadowColor: '#000000', dropShadowBlur: 6, dropShadowDistance: 0});
        this.sourceText.style.fontSize = (this.grid.size / 4);
        this.sourceText.anchor.set(0.5, 0.5);
        this.sourceText.resolution = 2;

        if ((this.pointer.source || "Unknown") == localStorage["userName"]) {
            return;
        }

        this.addChild(this.sourceText);
    }

    updatePosition(x: number, y: number) {
        this.emitter.updateOwnerPos(x, y);
        this.sourceText.position.set(x, y - this.grid.size / 1.5);
    }
}