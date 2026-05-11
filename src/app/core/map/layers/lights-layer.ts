import * as PIXI from 'pixi.js'
import { Layer } from './layer';
import { Tile } from 'src/app/shared/models/tile';
import { DataService } from 'src/app/shared/services/data.service';
import { Size, Token } from 'src/app/shared/models/token';
import { Light } from 'src/app/shared/models/light';
import { Grid } from '../models/grid';
import { CacheManager, ProgramManager } from 'src/app/shared/utils';

export class LightsLayer extends Layer {

  app!: PIXI.Application;
  tokens: Array<Token> = [];
  tiles: Array<Tile> = [];
  lights: Array<Light> = [];

  meshes: Array<PIXI.Mesh<PIXI.Geometry, PIXI.Shader>> = [];

  constructor(private dataService: DataService) {
    super();

    // let filter = new PIXI.filters.AlphaFilter(1.0)
    // filter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
    // this.filters = [filter];
  }

  isDirty: boolean = true;

  grid!: Grid

  update() {
    this.tokens = this.dataService.state.map?.tokens ?? []
    this.tiles = this.dataService.state.map?.tiles ?? []
    this.lights = this.dataService.state.map?.lights ?? []
    this.visible = this.dataService.state.map?.lineOfSight ?? false
  }

  async draw() {
    this.clear()

    if (!this.visible) {
      return this;
    }

    this.width = this.w / 2
    this.height = this.h / 2

    // tokens
    for (let token of this.tokens) {
      let vision = token.vision

      // check vision state
      if (vision == null || !vision.light || vision.sight == null || vision.lightColor == "#ffffff") {
        continue
      }

      // cached values
      let sightPolygon = CacheManager.sightPolygon.get(vision.id)
      let geometryPolygon = CacheManager.geometryPolygon.get(vision.id)

      // cache miss
      if (sightPolygon == undefined) {
        sightPolygon = vision.sight.polygon.map(point => point / 2)

        // update cache
        CacheManager.sightPolygon.set(vision.id, sightPolygon)
      }

      if (geometryPolygon == undefined) {
        // create geometry polygon for mesh rendering
        geometryPolygon = this.getGeometry(vision.sight.x / 2, vision.sight.y / 2, sightPolygon)

        // update cache
        CacheManager.geometryPolygon.set(vision.id, geometryPolygon)
      }

      // init shaders
      const shader = new PIXI.Shader({
        glProgram: ProgramManager.cached.get("light")!,
        resources: {
          lightUniforms: {
            position: { value: new Float32Array(2), type: 'vec2<f32>' },
            radiusMin: { value: 0, type: 'f32' },
            radiusMax: { value: 1, type: 'f32' },
            color: { value: new Float32Array(4), type: 'vec4<f32>' },
            intensity: { value: 1, type: 'f32' },
          }
        }
      })

      // create custom mesh from geometry
      const geo = new PIXI.Geometry({
        attributes: {
          aVertexPosition: new Float32Array(geometryPolygon),
        },
        topology: 'triangle-list',
      })
      let mesh = new PIXI.Mesh<PIXI.Geometry, PIXI.Shader>({ geometry: geo, shader })

      const gridSize = { width: token.width || 1, height: token.height || 1 }
      const size = this.grid.sizeFromGridSize(gridSize)
      let minSize = Math.max(size.width, size.height) / 2.0

      // populate uniforms
      const u = mesh.shader!.resources.lightUniforms.uniforms
      u.position = new Float32Array([vision.sight.x / 2, vision.sight.y / 2])
      u.radiusMin = ((vision.lightRadiusMin * this.grid.pixelRatio) + minSize) / 2
      u.radiusMax = ((vision.lightRadiusMax * this.grid.pixelRatio) + minSize) / 2
      u.color = new Float32Array(new PIXI.Color(vision.lightColor).toArray())
      u.intensity = vision.lightOpacity
      mesh.blendMode = 'add';

      this.addChild(mesh)
      this.meshes.push(mesh)
    }

    // tiles
    for (let tile of this.tiles) {
      let light = tile.light

      // check light state
      if (light == null || light.sight == null || light.sight.polygon == null || !light.enabled || light.color == "#ffffff") {
        continue
      }

      // cached values
      let sightPolygon = CacheManager.sightPolygon.get(light.id)
      let geometryPolygon = CacheManager.geometryPolygon.get(light.id)

      // cache miss
      if (sightPolygon == undefined) {
        sightPolygon = light.sight.polygon.map(point => point / 2)

        // update cache
        CacheManager.sightPolygon.set(light.id, sightPolygon)
      }

      // cache miss
      if (geometryPolygon == undefined) {
        // create geometry polygon for mesh rendering
        geometryPolygon = this.getGeometry(light.sight.x / 2, light.sight.y / 2, sightPolygon)

        // update cache
        CacheManager.geometryPolygon.set(light.id, geometryPolygon)
      }

      // init shaders
      const shader = new PIXI.Shader({
        glProgram: ProgramManager.cached.get("light")!,
        resources: {
          lightUniforms: {
            position: { value: new Float32Array(2), type: 'vec2<f32>' },
            radiusMin: { value: 0, type: 'f32' },
            radiusMax: { value: 1, type: 'f32' },
            color: { value: new Float32Array(4), type: 'vec4<f32>' },
            intensity: { value: 1, type: 'f32' },
          }
        }
      })

      // create custom mesh from geometry
      const geo = new PIXI.Geometry({
        attributes: {
          aVertexPosition: new Float32Array(geometryPolygon),
        },
        topology: 'triangle-list',
      })
      let mesh = new PIXI.Mesh<PIXI.Geometry, PIXI.Shader>({ geometry: geo, shader })

      // populate uniforms
      const u = mesh.shader!.resources.lightUniforms.uniforms
      u.position = new Float32Array([light.sight.x / 2, light.sight.y / 2])
      u.radiusMin = light.radiusMin * this.grid.pixelRatio / 2
      u.radiusMax = Math.max(light.radiusMin, light.radiusMax) * this.grid.pixelRatio / 2
      u.intensity = light.opacity
      u.color = new Float32Array(new PIXI.Color(light.color).toArray())
      mesh.blendMode = 'add';

      this.addChild(mesh)
      this.meshes.push(mesh)
    }

    // lights
    for (let light of this.lights) {
      // check light state
      if (light.sight == null || light.sight.polygon == null || !light.enabled || light.color == "#ffffff") {
        continue
      }

      // cached values
      let sightPolygon = CacheManager.sightPolygon.get(light.id)
      let geometryPolygon = CacheManager.geometryPolygon.get(light.id)

      // cache miss
      if (sightPolygon == undefined) {
        sightPolygon = light.sight.polygon.map(point => point / 2)

        // update cache
        CacheManager.sightPolygon.set(light.id, sightPolygon)
      }

      // cache miss
      if (geometryPolygon == undefined) {
        // create geometry polygon for mesh rendering
        geometryPolygon = this.getGeometry(light.sight.x / 2, light.sight.y / 2, sightPolygon)

        // update cache
        CacheManager.geometryPolygon.set(light.id, geometryPolygon)
      }

      // init shaders
      const shader = new PIXI.Shader({
        glProgram: ProgramManager.cached.get("light")!,
        resources: {
          lightUniforms: {
            position: { value: new Float32Array(2), type: 'vec2<f32>' },
            radiusMin: { value: 0, type: 'f32' },
            radiusMax: { value: 1, type: 'f32' },
            color: { value: new Float32Array(4), type: 'vec4<f32>' },
            intensity: { value: 1, type: 'f32' },
          }
        }
      })

      // create custom mesh from geometry
      const geo = new PIXI.Geometry({
        attributes: {
          aVertexPosition: new Float32Array(geometryPolygon),
        },
        topology: 'triangle-list',
      })
      let mesh = new PIXI.Mesh<PIXI.Geometry, PIXI.Shader>({ geometry: geo, shader })

      // populate uniforms
      const u = mesh.shader!.resources.lightUniforms.uniforms
      u.position = new Float32Array([light.sight.x / 2, light.sight.y / 2])
      u.radiusMin = light.radiusMin * this.grid.pixelRatio / 2
      u.radiusMax = Math.max(light.radiusMin, light.radiusMax) * this.grid.pixelRatio / 2
      u.intensity = light.opacity
      u.color = new Float32Array(new PIXI.Color(light.color).toArray())
      mesh.blendMode = 'add';

      this.addChild(mesh)
      this.meshes.push(mesh)
    }

    // update scale
    this.scale.set(2, 2)

    return this;
  }

  getGeometry(x: number, y: number, polygon: Array<number>) {
    let origin = [x, y]
    var buffer = [];
    for (let i = 0; i < polygon.length - 2; i = i + 2) {
      let cPoint = [polygon[i], polygon[i + 1]];
      let nPoint = [polygon[i + 2], polygon[i + 3]];

      buffer.push(origin[0]);
      buffer.push(origin[1]);
      buffer.push(cPoint[0]);
      buffer.push(cPoint[1]);
      buffer.push(nPoint[0]);
      buffer.push(nPoint[1]);
    }

    buffer.push(origin[0]);
    buffer.push(origin[1]);

    let first = [polygon[0], polygon[1]];
    let last = [polygon[polygon.length - 2], polygon[polygon.length - 1]];

    buffer.push(last[0]);
    buffer.push(last[1]);

    buffer.push(first[0]);
    buffer.push(first[1]);

    return buffer
  }

  clear() {
    for (let mesh of this.meshes) {
      mesh.destroy();
    }
    this.meshes = [];
    this.removeChildren();
  }
}
