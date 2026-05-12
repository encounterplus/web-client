import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Pointer } from 'src/app/shared/models/pointer';
import { Emitter, EmitterConfig } from "pixi-particle-system";
import { ParticleContainer } from "pixi.js";
import { Layer } from '../layers/layer';

export class PointerView extends View {

  grid: Grid;
  pointer: Pointer

  sourceText: PIXI.Text;

  particleContainer: PIXI.ParticleContainer;
  emitter: Emitter;

  constructor(pointer: Pointer, grid: Grid, private parentLayer: Layer, texture: PIXI.Texture) {
    super();

    let particleScale = (grid.size / 64.0) * 0.8;

    let config: EmitterConfig = {
      "emitterVersion": "0.0.0",
      "minParticleLifetime": 1,
      "maxParticleLifetime": 4,
      "spawnInterval": 0.05,
      "spawnChance": 1,
      "maxParticles": 500,
      "addAtBack": true,
      "particlesPerWave": 1,
      "alphaBehavior": {
        "mode": "list",
        "listData": {
          "list": [
            {
              "value": 1,
              "time": 0
            },
            {
              "value": 0,
              "time": 1
            }
          ]
        }
      },
      "colorBehavior": {
        "mode": "random",
        "listData": {
          "list": [
            {
              "value": pointer.color,
              "time": 0
            },
            {
              "value": pointer.color,
              "time": 1
            }
          ]
        }
      },
      "movementBehavior": {
        "minMoveSpeed": {
          "x": -50,
          "y": -50
        },
        "maxMoveSpeed": {
          "x": 50,
          "y": 50
        },
        "mode": "linear",
        "space": "global"
      },
      "rotationBehavior": {
        "listData": {
          "list": [
            { "time": 0.0, "value": 0 },
            { "time": 1.0, "value": Math.PI * 2 },
          ]
        },
        "mode": "list",
      },
      "scaleBehavior": {
        "xListData": {
          "list": [
            { "value": 1.0 * particleScale, "time": 0 },
            { "value": 0.8 * particleScale, "time": 1}
          ]
        },
        "yListData": {
          "list": [
            { "value": 1.0 * particleScale, "time": 0 },
            { "value": 0.8 * particleScale, "time": 1 }
          ]
        },
        "mode": "list"
      },
      "spawnBehavior": {
        "origin": {
          "x": 0,
          "y": 0
        },
        "shape": "point",
        "direction": {
          "x": 0,
          "y": -1
        }
      },
      "textureBehavior": {
        "mode": "static",
        "textureConfigs": [
          {
            "textures": [texture]
          }
        ]
      },
    }

    // create container
    this.particleContainer = new PIXI.ParticleContainer()
    this.addChild(this.particleContainer)

    // create emitter
    this.emitter = new Emitter(this.particleContainer, config);

    this.pointer = pointer;
    this.grid = grid;

    // create source label
    this.sourceText = new PIXI.Text({ text: this.pointer.source || "Unknown", style: { fontFamily: 'Arial', fontSize: 30, fill: 0xffffff, align: 'center', dropShadow: { color: '#000000', blur: 6, distance: 0, alpha: 1, angle: 0 } } });
    this.sourceText.style.fontSize = (this.grid.size / 4);
    this.sourceText.anchor.set(0.5, 0.5);
    this.sourceText.resolution = 2;

    if ((this.pointer.source || "Unknown") == localStorage["userName"]) {
      return;
    }

    this.addChild(this.sourceText);
  }

  play() {
    this.emitter.play()
  }

  stop() {
    this.emitter.stop()
  }

  destroy(options?: PIXI.DestroyOptions): void {
    super.destroy(options);
  }

  updatePosition(x: number, y: number) {
    this.sourceText.position.set(x, y - this.grid.size / 1.5);
    this.emitter.spawnBehavior.origin.x = x;
    this.emitter.spawnBehavior.origin.y = y;
  }
}