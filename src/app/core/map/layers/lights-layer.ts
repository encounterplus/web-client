import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Tile } from 'src/app/shared/models/tile';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';

export class LightsLayer extends Layer {

    app: PIXI.Application;
    creatures: Array<Creature> = [];
    tiles: Array<Tile> = [];
    
    vert: PIXI.LoaderResource;
    frag: PIXI.LoaderResource;

    lights: Array<PIXI.Mesh> = [];

    constructor(private dataService: DataService) {
        super();

        // let filter = new PIXI.filters.AlphaFilter(1.0)
        // filter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        // this.filters = [filter];
    }

    isDirty: boolean = true;

    update() {
        this.creatures = this.dataService.state.mapCreatures;
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

        for(let creature of this.creatures) {
            if(creature.vision != null && creature.light.enabled && creature.vision.polygon != null) {
                let polygon = this.getGeometry2(creature.vision.x, creature.vision.y, creature.vision.polygon);;
                let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

                let geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', polygon)
                    // .addIndex([3,2,1,3,1,0]);

                let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader);
               
                mesh.shader.uniforms.position = [creature.vision.x, creature.vision.y]
                mesh.shader.uniforms.radiusMin = creature.vision.radiusMin;
                mesh.shader.uniforms.radiusMax = creature.vision.radiusMax;
                mesh.shader.uniforms.color = PIXI.utils.hex2rgb(PIXI.utils.string2hex(creature.vision.color));
                mesh.shader.uniforms.falloff = [1.0, 0.1, 50];
                mesh.shader.uniforms.intensity = creature.light.opacity;
                mesh.blendMode = PIXI.BLEND_MODES.ADD;

                this.addChild(mesh);
                this.lights.push(mesh);
            }
        }

        // tiles
        for(let tile of this.tiles) {
            if(tile.vision != null && tile.light.enabled && tile.vision.polygon != null) {
                let polygon = this.getGeometry2(tile.vision.x, tile.vision.y, tile.vision.polygon);
                let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

                let geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', polygon)
                    // .addIndex([3,2,1,3,1,0]);

                let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader);
               
                mesh.shader.uniforms.position = [tile.vision.x, tile.vision.y]
                mesh.shader.uniforms.radiusMin = tile.vision.radiusMin;
                mesh.shader.uniforms.radiusMax = tile.vision.radiusMax;
                mesh.shader.uniforms.color = PIXI.utils.hex2rgb(PIXI.utils.string2hex(tile.vision.color));
                mesh.shader.uniforms.falloff = [1.0, 0.01, 10];
                mesh.shader.uniforms.intensity = tile.light.opacity;
                // mesh.blendMode = PIXI.BLEND_MODES.MULTIPLY;
                mesh.blendMode = PIXI.BLEND_MODES.ADD;

                this.addChild(mesh);
                this.lights.push(mesh);

            }
        }
        this.isDirty = true
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
        for(let mesh of this.lights) {
            mesh.destroy();
        }
        this.lights = [];
        this.removeChildren();
    }
}
