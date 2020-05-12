import { Creature, CreatureType } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TileView } from '../views/tile-view';

import * as pixi from 'pixi.js';
import * as particles from "pixi-particles";
import { Loader } from '../models/loader';

export class ParticlesLayer extends Layer {

    constructor(private dataService: DataService) {
        super();
    }

    ringTexture: PIXI.Texture; 

    async draw() {
        // this.clear();

        this.w = this.parent.width;
        this.h = this.parent.height;

        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        return this;
    }

    async drawPointer(x: number, y: number, color: number) {
        if (!this.ringTexture) {
            this.ringTexture = await Loader.shared.loadTexture('/assets/img/ring.png', true);
        }

        var emitter = new particles.Emitter(

            // The PIXI.Container to put the emitter in
            // if using blend modes, it's important to put this
            // on top of a bitmap, and not use the root stage Container
            this,
        
            // The collection of particle images to use
            [this.ringTexture],
        
            // Emitter configuration, edit this to change the look
            // of the emitter
            {
                alpha: {
                    list: [
                        {
                            value: 0.0,
                            time: 0
                        },
                        {
                            value: 1,
                            time: 0.5
                        },
                        {
                            value: 0.0,
                            time: 1
                        }
                    ],
                    isStepped: false
                },
                scale: {
                    list: [
                        {
                            value: 0.3,
                            time: 0
                        },
                        {
                            value: 0.4,
                            time: 1
                        }
                    ],
                    isStepped: false
                },
                color: {
                    list: [
                        {
                            value: PIXI.utils.hex2string(color),
                            time: 0
                        },
                        {
                            value: PIXI.utils.hex2string(color),
                            time: 1
                        }
                    ],
                    isStepped: false
                },
                speed: {
                    list: [
                        {
                            value: 200,
                            time: 0
                        },
                        {
                            value: 100,
                            time: 1
                        }
                    ],
                    isStepped: false
                },
                startRotation: {
                    min: 0,
                    max: 360
                },
                rotationSpeed: {
                    min: 0,
                    max: 0
                },
                lifetime: {
                    min: 0.5,
                    max: 0.5
                },
                frequency: 0.008,
                spawnChance: 1,
                particlesPerWave: 1,
                emitterLifetime: 0.5,
                maxParticles: 500,
                pos: {
                    x: 0,
                    y: 0
                },
                addAtBack: false,
                spawnType: "circle",
                spawnCircle: {
                    x: 0,
                    y: 0,
                    r: 10
                }
            }
        );

        emitter.updateOwnerPos(x, y);
        
        emitter.emit = true;
        emitter.autoUpdate = true;
        emitter.playOnceAndDestroy()
    }

    clear() {
        this.removeChildren();
    }
}