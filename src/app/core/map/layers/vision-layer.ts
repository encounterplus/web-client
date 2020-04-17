import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { CreatureComponent } from '../../creature/creature.component';

export class VisionLayer extends Layer {

    app: PIXI.Application;
    creatures: Array<Creature> = [];

    updateCreatures(creatures: Array<Creature>) {
        this.creatures = creatures;
    }

    shader: PIXI.Shader;

    vert: PIXI.LoaderResource;
    frag: PIXI.LoaderResource;

    async draw() {
        this.clear();

        // const lighting = new PIXI.Display.Layer();
        // lighting.on('display', (element) => {
        //     element.blendMode = PIXI.BLEND_MODES.ADD;
        // });
        // lighting.useRenderTexture = true;
        // lighting.clearColor = [0.5, 0.5, 0.5, 1]; // ambient gray

        // this.addChild(lighting);

        // const lightingSprite = new PIXI.Sprite(lighting.getRenderTexture());
        // lightingSprite.blendMode = PIXI.BLEND_MODES.MULTIPLY;

        // this.addChild(lightingSprite);

        var bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        bg.width = 500;
        bg.height = 500;
        bg.tint = 0x000000;
        // bg.blendMode = 21;
        bg.blendMode = PIXI.BLEND_MODES.SUBTRACT;

        // load filters
        if (this.shader == null) {
            this.vert = await this.loadResource("/assets/shaders/vision.vert");
            this.frag = await this.loadResource("/assets/shaders/vision.frag");

            this.shader = PIXI.Shader.from(this.vert.data, this.frag.data);

            // this.filter = new PIXI.Filter(null, res.data, {
            //     position: [0.0, 0.0], radiusMin: 0.0, radiusMax: 0.0, color: [0,0,0,0], intensity: 0.0
            // });
        }

        for(let creature of this.creatures) {
            // console.log(creature);
            if(creature.vision != null && creature.vision.polygon != null) {

                // console.log(creature.vision.polygon);

                let origin = [creature.vision.x, creature.vision.y]
                var polygon = [];
                for (let i = 0; i < creature.vision.polygon.length - 2; i = i + 2) {
                    let cPoint = [creature.vision.polygon[i], creature.vision.polygon[i + 1]];
                    let nPoint = [creature.vision.polygon[i + 2], creature.vision.polygon[i + 3]];

                    polygon.push(origin[0]);
                    polygon.push(origin[1]);
                    polygon.push(cPoint[0]);
                    polygon.push(cPoint[1]);
                    polygon.push(nPoint[0]);
                    polygon.push(nPoint[1]);
                }

                polygon.push(origin[0]);
                polygon.push(origin[1]);

                let first = [creature.vision.polygon[0], creature.vision.polygon[1]];
                let last = [creature.vision.polygon[creature.vision.polygon.length - 2], creature.vision.polygon[creature.vision.polygon.length - 1]];

                polygon.push(last[0]);
                polygon.push(last[1]);

                polygon.push(first[0]);
                polygon.push(first[1]);

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
                mesh.shader.uniforms.dimensions = [this.app.screen.width, this.app.screen.height];
                // mesh.blendMode = 21;
                // mesh.texture.baseTexture.alphaMode = PIXI.ALPHA_MODES.PREMULTIPLIED_ALPHA;

                this.addChild(mesh);

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

        this.addChild(bg);

        return this;
    }

    clear() {
        this.removeChildren();
    }
}