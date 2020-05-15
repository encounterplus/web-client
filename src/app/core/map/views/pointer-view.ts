import { View } from './view';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { Aura } from 'src/app/shared/models/aura';
import * as particles from "pixi-particles";
import { Pointer } from 'src/app/shared/models/pointer';

export class PointerView extends particles.Emitter {

    grid: Grid;
    pointer: Pointer
    particleTexture: PIXI.Texture;

    constructor(pointer: Pointer, grid: Grid, parent: PIXI.Container, texture: PIXI.Texture) {

        let config = {
            alpha: {
                start: 1,
                end: 0
            },
            scale: {
                start: 1,
                end: 0.8
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


        super(parent, texture, config);

        this.autoUpdate = true;
        this.particleBlendMode = PIXI.BLEND_MODES.ADD;

        this.pointer = pointer;
        this.grid = grid;
    }
    
}