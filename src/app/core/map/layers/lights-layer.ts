import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Tile } from 'src/app/shared/models/tile';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { Token } from 'src/app/shared/models/token';
import { Light } from 'src/app/shared/models/light';

export class LightsLayer extends Layer {

    app: PIXI.Application;
    tokens: Array<Token> = [];
    tiles: Array<Tile> = [];
    lights: Array<Light> = [];
    
    vert: PIXI.LoaderResource;
    frag: PIXI.LoaderResource;

    meshes: Array<PIXI.Mesh> = [];

    constructor(private dataService: DataService) {
        super();

        // let filter = new PIXI.filters.AlphaFilter(1.0)
        // filter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        // this.filters = [filter];
    }

    isDirty: boolean = true;

    update() {
        this.tokens = this.dataService.state.map.tokens;
        this.tiles = this.dataService.state.map.tiles;
        this.visible = this.dataService.state.map.lineOfSight;
    }

    async draw() {
        this.clear();   
        
        if (!this.visible) {
            return;
        }

        // load filters
        if (this.vert == null || this.frag == null) {
            this.vert = await Loader.shared.loadResource("/assets/shaders/vision.vert");
            this.frag = await Loader.shared.loadResource("/assets/shaders/light.frag");
        }

        // tokens
        for(let token of this.tokens) {
            let vision = token.vision

            // check vision state
            if (vision == null || !vision.light) {
                continue
            }

            // create geometry polygon for mesh rendering
            let polygon = this.getGeometry2(vision.sight.x, vision.sight.y, vision.sight.polygon)

            // init shaders
            let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

            // create custom mesh from geometry
            let geometry = new PIXI.Geometry()
                .addAttribute('aVertexPosition', polygon);
            let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
            
            // populate uniforms
            mesh.shader.uniforms.position = [vision.sight.x, vision.sight.y]
            mesh.shader.uniforms.radiusMin = [vision.lightRadiusMin]
            mesh.shader.uniforms.radiusMax = [vision.lightRadiusMax]
            mesh.shader.uniforms.color = PIXI.utils.hex2rgb(PIXI.utils.string2hex(vision.lightColor));
            mesh.shader.uniforms.intensity = vision.lightOpacity
            mesh.blendMode = PIXI.BLEND_MODES.ADD;

            this.addChild(mesh)
            this.meshes.push(mesh)
        }

        // tiles
        for(let tile of this.tiles) {
            let light = tile.light

            // check light state
            if (light.sight == null || light.sight.polygon == null || !light.enabled) {
                continue
            }

            // create geometry polygon for mesh rendering
            let polygon = this.getGeometry2(light.sight.x, light.sight.y, light.sight.polygon)

            // init shaders
            let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

            // create custom mesh from geometry
            let geometry = new PIXI.Geometry()
                .addAttribute('aVertexPosition', polygon);
            let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
            
            // populate uniforms
            mesh.shader.uniforms.position = [light.sight.x, light.sight.y]
            mesh.shader.uniforms.radiusMin = light.radiusMin
            mesh.shader.uniforms.radiusMax = light.radiusMax
            mesh.shader.uniforms.intensity = light.opacity
            mesh.shader.uniforms.color = PIXI.utils.hex2rgb(PIXI.utils.string2hex(light.color))
            mesh.blendMode = PIXI.BLEND_MODES.ADD

            this.addChild(mesh)
            this.meshes.push(mesh)
        }

        // lights
        for(let light of this.lights) {
            // check light state
            if (light.sight == null || light.sight.polygon == null || !light.enabled) {
                continue
            }

            // create geometry polygon for mesh rendering
            let polygon = this.getGeometry2(light.sight.x, light.sight.y, light.sight.polygon)

            // init shaders
            let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

            // create custom mesh from geometry
            let geometry = new PIXI.Geometry()
                .addAttribute('aVertexPosition', polygon);
            let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
            
            // populate uniforms
            mesh.shader.uniforms.position = [light.sight.x, light.sight.y]
            mesh.shader.uniforms.radiusMin = light.radiusMin
            mesh.shader.uniforms.radiusMax = light.radiusMax
            mesh.shader.uniforms.intensity = light.opacity
            mesh.shader.uniforms.color = PIXI.utils.hex2rgb(PIXI.utils.string2hex(light.color))
            mesh.blendMode = PIXI.BLEND_MODES.ADD

            this.addChild(mesh)
            this.meshes.push(mesh)
        }
        return this;
    }

    getGeometry(x: number, y: number, size: number) {
        var vertices = [
            x - size, y - size,
            x - size, y + size,
            x + size, y + size,
            x + size, y - size
        ];
        return vertices;
    }

    getGeometry2(x: number, y: number, polygon: Array<number>) {
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
        for(let mesh of this.meshes) {
            mesh.destroy();
        }
        this.lights = [];
        this.removeChildren();
    }
}
