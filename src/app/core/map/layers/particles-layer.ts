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

    data: PIXI.interaction.InteractionData;
    dragging: boolean = false;
    clicked: boolean = false;

    constructor(private dataService: DataService) {
        super();

        this.interactive = true;
        // this.buttonMode = true;

        this
            .on('pointerdown', this.onPointerUp)
            .on('pointerup', this.onPointerDown);
            // .on('pointermove', this.onDragMove);
    }

    ringTexture: PIXI.Texture; 

    async draw() {
        // this.clear();

        this.w = this.parent.width;
        this.h = this.parent.height;

        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        return this;
    }

    async drawPointer(point: PIXI.Point) {
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
                            value: "fb1010",
                            time: 0
                        },
                        {
                            value: "f5b830",
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

        emitter.updateOwnerPos(point.x, point.y);
        
        emitter.emit = true;
        emitter.autoUpdate = true;
        emitter.playOnceAndDestroy()
    }

    clear() {
        this.removeChildren();
    }

    double: any;

    onPointerUp(event: PIXI.interaction.InteractionEvent) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        

        if (this.clicked) {
            console.log('double click');
            const newPosition = event.data.getLocalPosition(this.parent);
            console.log(newPosition);

            this.drawPointer(newPosition);
            return
        }

        // console.log('pointer down');

        this.clicked = false;
        clearTimeout(this.double)

        this.data = event.data;
        this.dragging = true;
    }
    
    onPointerDown() {
        // console.log('pointer up');
        this.dragging = false;
        // set the interaction data to null
        this.data = null;

        this.clicked = true;
        this.double = setTimeout(() => { this.clicked = false; }, 400); 
    }
    
    onDragMove() {
        if (this.dragging) {
            // console.log('dragging');
            // const newPosition = this.data.getLocalPosition(this.parent);
            // this.x += this.data.global.x - this.x;
            // this.y += this.data.global.y - this.y;
        }
    }
}