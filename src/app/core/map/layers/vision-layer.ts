// import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
// import * as PIXIDISPLAY from 'pixi-layers';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { CreatureComponent } from '../../creature/creature.component';
import { Tile } from 'src/app/shared/models/tile';
import { Loader } from '../models/loader';

export class VisionLayer extends Layer {

    

    creatures: Array<Creature> = [];
    tiles: Array<Tile> = [];

    updateCreatures(creatures: Array<Creature>) {
        this.creatures = creatures;
    }

    updateTiles(tiles: Array<Tile>) {
        this.tiles = tiles;
    }

    vert: PIXI.LoaderResource;
    frag: PIXI.LoaderResource;

    lighting: PIXI.display.Layer
    lightingSprite: PIXI.Sprite;

    bg: PIXI.Sprite;

    visions: Array<PIXI.Mesh> = [];

    constructor() {
        super();

        this.bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.bg.tint = 0x000000;

        let filter = new PIXI.filters.AlphaFilter(1.0)
        filter.blendMode = PIXI.BLEND_MODES.MULTIPLY;
        this.filters = [filter];
    }

    async draw() {
        // this.cacheAsBitmap = false;
        this.clear();

        if (!this.visible) {
            return;
        }

        const startTime = performance.now();

        this.bg.width = this.w + 10;
        this.bg.height = this.h + 10;
        this.bg.position.set(-5, -5);
        this.addChild(this.bg);

        // load filters
        if (this.vert == null || this.frag == null) {
            this.vert = await Loader.shared.loadResource("/assets/shaders/vision.vert");
            this.frag = await Loader.shared.loadResource("/assets/shaders/vision.frag");
        }

        let msk = new PIXI.Graphics();
        msk.beginFill(0xffffff);

        for(let creature of this.creatures) {
            // console.log(creature);
            if(creature.vision != null && creature.vision.polygon != null) {

                // console.log(creature.vision.polygon);

                let polygon = this.getGeometry(creature.vision.x, creature.vision.y, creature.vision.polygon)
                // console.log(polygon);

                // let polygon = PIXI.utils.earcut (creature.vision.polygon, null, 2);

                let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

                let geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', polygon);

                let mesh = new PIXI.Mesh(geometry, shader);
               
                mesh.shader.uniforms.position = [creature.vision.x, creature.vision.y]
                mesh.shader.uniforms.radiusMin = [creature.vision.radiusMin];
                mesh.shader.uniforms.radiusMax = [creature.vision.radiusMax];
                mesh.shader.uniforms.intensity = 1.0;
                mesh.blendMode = PIXI.BLEND_MODES.ADD;
                
                // mesh.parentLayer = this.lighting;
                // mesh.blendMode = 21;
                // mesh.texture.baseTexture.alphaMode = PIXI.ALPHA_MODES.PREMULTIPLIED_ALPHA;

                this.addChild(mesh);
                this.visions.push(mesh);

                msk.drawPolygon(creature.vision.polygon);
                // mesh.cacheAsBitmap = true;


                // var graphics = new PIXI.Graphics();
                // graphics.beginFill(0xffffff);
                // graphics.drawPolygon(creature.vision.polygon);
                // graphics.endFill();
                // this.addChild(graphics);

                // this.filter.uniforms.position = [creature.vision.x, creature.vision.y];
                // this.filter.uniforms.radiusMin = [creature.vision.radiusMin];
                // this.filter.uniforms.radiusMax = [creature.vision.radiusMax];

                // graphics.filters = [this.filter];
            }
        }

        msk.endFill();

        // tiles
        for(let tile of this.tiles) {
            // console.log(creature);
            if(tile.vision != null && tile.vision.polygon != null) {
                let polygon = this.getGeometry(tile.vision.x, tile.vision.y, tile.vision.polygon)
                let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

                let geometry = new PIXI.Geometry()
                    .addAttribute('aVertexPosition', polygon);

                let mesh = new PIXI.Mesh(geometry, shader);
               
                mesh.shader.uniforms.position = [tile.vision.x, tile.vision.y]
                mesh.shader.uniforms.radiusMin = [tile.vision.radiusMin];
                mesh.shader.uniforms.radiusMax = [tile.vision.radiusMax];
                mesh.shader.uniforms.intensity = 1.0;
                mesh.blendMode = PIXI.BLEND_MODES.ADD;

                this.addChild(mesh);
                this.visions.push(mesh);

                mesh.mask = msk;
                // mesh.cacheAsBitmap = true;
                // mesh.filterArea = new PIXI.Rectangle(0, 0, this.w, this.h);
            }
        }

        this.addChild(msk)

        const endTime = performance.now();
        const elaspedTimeInMilliseconds = endTime - startTime;
        // console.log(elaspedTimeInMilliseconds);

        // this.cacheAsBitmap = true;

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
        for(let mesh of this.visions) {
            mesh.destroy();
        }
        this.visions = [];
        this.removeChildren();
    }
}