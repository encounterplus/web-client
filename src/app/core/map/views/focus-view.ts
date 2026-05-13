import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Emitter, EmitterConfig } from 'pixi-particle-system';
import { Layer } from '../layers/layer';

export class FocusView extends View {

  grid: Grid;
  particleTexture: PIXI.Texture;
  sourceText: PIXI.Text;

  particleContainer: PIXI.ParticleContainer;
  emitter: Emitter;

  constructor(private color: string, grid: Grid, private parentLayer: Layer, texture: PIXI.Texture) {
    super();

    let particleScale = (grid.size / 480.0) * 6;

    let config: EmitterConfig = {
      "emitterVersion": "0.0.0",
      "minParticleLifetime": 2,
      "maxParticleLifetime": 2,
      "spawnInterval": 0.75,
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
              "value": color,
              "time": 0
            },
            {
              "value": color,
              "time": 1
            }
          ]
        }
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
            { "value": 0, "time": 0 },
            { "value": 1.0 * particleScale, "time": 1 }
          ]
        },
        "yListData": {
          "list": [
            { "value": 0, "time": 0 },
            { "value": 1.0 * particleScale, "time": 1 }
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
  }

  play() {
    this.emitter.play()
    setTimeout(() => this.stop(), 2000)
  }

  stop() {
    this.emitter.stop()

    setTimeout(() => this.destroy(), 2000)
  }

  destroy(options?: PIXI.DestroyOptions): void {
    super.destroy(options);

    console.debug("destroying focus view")
    this.removeChildren();
  }

  updatePosition(x: number, y: number) {
    this.emitter.spawnBehavior.origin.x = x;
    this.emitter.spawnBehavior.origin.y = y;
  }
}