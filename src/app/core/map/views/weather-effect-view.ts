import { View } from './view';
import { Grid } from '../models/grid';
import * as PIXI from 'pixi.js'
import { WeatherType } from 'src/app/shared/models/map';
import { Emitter, EmitterConfig } from 'pixi-particle-system';
import { Layer } from '../layers/layer';
import { CenterAttractionBehavior } from './center-attraction-behavior';

export class WeatherEffectView extends View {

  weatherEffect: String;
  particleTexture: PIXI.Texture;

  particleContainer: PIXI.ParticleContainer;
  emitter: Emitter;

  snowConfig(texture: PIXI.Texture): EmitterConfig {
    const scale = (this.grid.size / 64.0) * 0.15;
    const edge = Math.max(this.w, this.h) * 1.2

    const intensity = this.intensity

    console.debug(this.w, this.h, edge, scale, intensity)

    let config: EmitterConfig = {
      "emitterVersion": "0.0.0",
      "minParticleLifetime": 1,
      "maxParticleLifetime": 1.6,
      "spawnInterval": 1 / (300 * (intensity <= 1 ? intensity : intensity**3 )),
      "spawnChance": 1,
      "maxParticles": 3000,
      "addAtBack": false,
      "particlesPerWave": 1,
      "alphaBehavior": {
        "mode": "list",
        "listData": {
          "list": [
            { "value": 0.9, "time": 0 },
            { "value": 0.0, "time": 1 }
          ]
        }
      },
      "scaleBehavior": {
        "xListData": {
          "list": [
            { "value": scale, "time": 0 },
            { "value": 0.6 * scale, "time": 1 }
          ]
        },
        "yListData": {
          "list": [
            { "value": scale, "time": 0 },
            { "value": 0.6 * scale, "time": 1 }
          ]
        },
        "mode": "list"
      },
      "colorBehavior": {
        "value": "#ffffff",
        "mode": "static"
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
      "spawnBehavior": {
        "origin": {
          "x": 0,
          "y": 0
        },
        "shape": "circle",
        "outerRadius": edge / 2,
        "innerRadius": edge * 0.05 * intensity,
        "direction": { "x": 0, "y": 0 },
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

    return config
  }

  rainConfig(texture: PIXI.Texture): EmitterConfig {
    const scale = (this.grid.size / 64.0) * 0.3;
    const edge = Math.max(this.w, this.h) * 1.2

    const intensity = this.intensity
    const speed = 1200 * (intensity <= 1 ? 1.0 : intensity**2)

    let config: EmitterConfig = {
      "emitterVersion": "0.0.0",
      "minParticleLifetime": 0.7,
      "maxParticleLifetime": 1.1,
      "spawnInterval": 1 / (500 * intensity),
      "spawnChance": 1,
      "maxParticles": 3000,
      "addAtBack": false,
      "particlesPerWave": 1,
      "alphaBehavior": {
        "mode": "list",
        "listData": {
          "list": [
            { "value": 0.5, "time": 0 },
            { "value": 0.0, "time": 1 }
          ]
        }
      },
      "scaleBehavior": {
        "xListData": {
          "list": [
            { "value": scale, "time": 0 },
            { "value": 0.9 * scale, "time": 1 }
          ]
        },
        "yListData": {
          "list": [
            { "value": scale, "time": 0 },
            { "value": 0.9 * scale, "time": 1 }
          ]
        },
        "mode": "list"
      },
      "colorBehavior": {
        "value": "#ffffff",
        "mode": "static"
      },
      "movementBehavior": {
        "minMoveSpeed": {
            "x": 0,
            "y": speed
        },
        "maxMoveSpeed": {
            "x": 0,
            "y": speed
        },
        "mode": "linear",
        "space": "local"
      },
      "rotationBehavior": {
        "mode": "static",
        "value": 70 * (Math.PI / 180),
      },
      "spawnBehavior": {
        "origin": {
          "x": 0,
          "y": 0
        },
        "shape": "rectangle",
        "width": this.w * 1.2,
        "height": this.h,
        "direction": {
            "x": 0.4,
            "y": 1
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

    return config
  }

  fogConfig(texture: PIXI.Texture): EmitterConfig {
    const scale = (this.grid.size / 400.0) * 20;
    const edge = Math.max(this.w, this.h) * 1.2
    const intensity = this.intensity
    const speed = 100 * (intensity <= 1 ? 1.0 : intensity)

    let config: EmitterConfig = {
      "emitterVersion": "0.0.0",
      "minParticleLifetime": 10,
      "maxParticleLifetime": 20,
      "spawnInterval": 0.3 / (0.7 * (intensity <= 1 ? 1.0 : intensity**3 )),
      "spawnChance": 1,
      "maxParticles": 2000,
      "addAtBack": false,
      "particlesPerWave": 1,
      "alphaBehavior": {
        "mode": "list",
        "listData": {
          "list": [
            { "value": 0, "time": 0 },
            { "value": 0.1, "time": 0.1 },
            { "value": 0, "time": 1 }
          ]
        }
      },
      "scaleBehavior": {
        "xListData": {
          "list": [
            { "value": scale, "time": 0 },
            { "value": 1.1 * scale, "time": 1 }
          ]
        },
        "yListData": {
          "list": [
            { "value": scale, "time": 0 },
            { "value": 1.1 * scale, "time": 1 }
          ]
        },
        "mode": "list"
      },
      "colorBehavior": {
        "value": "#ffffff",
        "mode": "static"
      },
      "movementBehavior": {
        "minMoveSpeed": {
            "x": speed * 0.8,
            "y": 0
        },
        "maxMoveSpeed": {
            "x": speed,
            "y": 0
        },
        "mode": "linear",
        "space": "global"
      },
      "rotationBehavior": {
        "listData": {
          "list": [
            { "value": 0, "time": 0 },
            { "value": 1, "time": Math.PI * 2 },
          ]
        },
        "mode": "list",
      },
      "spawnBehavior": {
        "origin": {
          "x": 0,
          "y": 0
        },
        "shape": "rectangle",
        "width": this.w * 1.2,
        "height": this.h,
        "direction": {
            "x": 0,
            "y": 0
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

    return config
  }

  constructor(type: WeatherType, private intensity: number, private grid: Grid, private parentLayer: Layer, texture: PIXI.Texture) {
    super();

    this.w = parentLayer.w
    this.h = parentLayer.h

    let config: EmitterConfig

    switch (type) {
      case WeatherType.fog:
        config = this.fogConfig(texture)
        break
      case WeatherType.rain:
        config = this.rainConfig(texture)
        break
      case WeatherType.snow:
        config = this.snowConfig(texture)
        break
      default:
        config = { "emitterVersion": '0.0.0' }
        break
    }

    // create container
    this.particleContainer = new PIXI.ParticleContainer()
    this.addChild(this.particleContainer)

    // create emitter
    this.emitter = new Emitter(this.particleContainer, config)

    // additional configuration for snow
    if (type == WeatherType.snow) {
      const attractBehavior = new CenterAttractionBehavior(this.emitter);
      const distance = 0.15 * (intensity <= 1.0 ? 1.0 : intensity**2.4)
      attractBehavior.applyConfig({ center: { x: this.w / 2, y: this.h / 2 }, startSpeed: 2, endSpeed: 0.0, distance: distance, directionJitter: 0.2 });
      this.emitter.addToActiveInitBehaviors(attractBehavior);
      this.emitter.addToActiveUpdateBehaviors(attractBehavior);
    }

    // // this.emitter.update((Date.now() + 1000));
    // this.emitter.autoUpdate = true;

    // advance for 10 seconds
    // this.emitter.autoUpdate = false;
    // this.emitter.update((10));
    // this.emitter.autoUpdate = true;

    this.grid = grid
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
    this.emitter.spawnBehavior.origin.x = x;
    this.emitter.spawnBehavior.origin.y = y;
  }
}