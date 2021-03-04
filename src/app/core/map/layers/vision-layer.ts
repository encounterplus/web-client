import { Layer } from './layer'
import { Tile } from 'src/app/shared/models/tile'
import { Loader } from '../models/loader'
import { DataService } from 'src/app/shared/services/data.service'
import { Size, Token } from 'src/app/shared/models/token'
import { Light } from 'src/app/shared/models/light'
import { GridType } from 'src/app/shared/models/map'
import { Grid } from '../models/grid'
import { Vision, VisionType } from 'src/app/shared/models/vision'

export class VisionLayer extends Layer {
    tokens: Array<Token> = []
    // tiles: Array<Tile> = []
    lights: Array<Light> = []
    
    intensity: number = 1.0
    mapScale: number = 1.0

    gridSize: number = 50.0
    gridScale: number = 5.0

    grid: Grid


    get pixelRatio(): number {
        return this.gridSize / this.gridScale
    }

    get activeToken(): Token {
        if (this.dataService.state.screen.sharedVision) {
            return null
        }

        // get tokenId from storage
        let activeTokenId = localStorage['userTokenId']
        if (activeTokenId) {
            // outside of turn
            if (!this.dataService.state.game.started || this.dataService.state.turned.tokenId != activeTokenId) {
                return null
            }
            for (let token of this.dataService.state.map.tokens) {
                if (token.id == activeTokenId) {
                    return token
                }
            }
        }
        return null
    }

    update() {
        this.tokens = this.dataService.state.map.tokens
        // this.tiles = this.dataService.state.map.tiles
        this.lights = [...(this.dataService.state.map.tiles.filter(tile => tile.light != null).map(tile => tile.light)), ...this.dataService.state.map.lights] 
        this.visible = this.dataService.state.map.lineOfSight // || this.dataService.state.map.fogOfWar
        this.intensity = 1.0 - (this.dataService.state.map.daylight || 0.0)
        this.mapScale = this.dataService.state.map.scale
        this.gridScale = this.dataService.state.map.gridScale

        // adjusted grid size
        this.gridSize = (this.dataService.state.map.gridType != GridType.square) ? this.dataService.state.map.gridSize * Math.sqrt(3) * 0.8 : this.dataService.state.map.gridSize
    }

    vert: PIXI.LoaderResource;
    frag: PIXI.LoaderResource;

    bg: PIXI.Sprite;

    meshes: Array<PIXI.Mesh> = [];

    msk: PIXI.Graphics;

    constructor(private dataService: DataService) {
        super();

        this.bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        this.bg.tint = 0x000000;

        let alphaFilter = new PIXI.filters.AlphaFilter(1.0)
        alphaFilter.blendMode = PIXI.BLEND_MODES.MULTIPLY;

        let blurFilter = new PIXI.filters.BlurFilter()
        blurFilter.quality = 2
        blurFilter.blur = 3

        if (localStorage['softEdges'] == 'true') {
            this.filters = [blurFilter, alphaFilter]
        } else {
            this.filters = [alphaFilter]
        }
    }

    drawToken(token: Token, type: VisionType, masked: boolean): PIXI.Mesh {
        let vision = token.vision

        // check vision state
        if (vision == null || vision.sight == null || vision.sight.polygon == null) {
            return
        }

        // create geometry polygon for mesh rendering
        let polygon = this.getGeometry(vision.sight.x, vision.sight.y, vision.sight.polygon)
        // this might be better triangle filling function
        // let polygon = PIXI.utils.earcut (creature.vision.polygon, null, 2);

        // init shaders
        let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

        // create custom mesh from geometry
        let geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', polygon);
        let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)

        let size = this.grid.sizeFromGridSize(Size.toGridSize(token.size))
        let minSize = Math.max(size.width, size.height) / 2.0

        // temporary radius
        let lightRadiusMin = vision.light ? vision.lightRadiusMin * this.pixelRatio + minSize : 0
        let lightRadiusMax = vision.light ? vision.lightRadiusMax * this.pixelRatio + minSize : 0
        let darkRadiusMin = vision.dark ? vision.darkRadiusMin * this.pixelRatio + minSize : 0
        let darkRadiusMax = vision.dark ? vision.darkRadiusMax * this.pixelRatio + minSize : 0

        // final radius for shader
        let radiusMin: number
        let radiusMax: number

        switch (type) {
            case VisionType.light:
                radiusMin = lightRadiusMin
                radiusMax = lightRadiusMax
                break
            case VisionType.dark:
                radiusMin = darkRadiusMin
                radiusMax = darkRadiusMax
                break
            default:
                radiusMin = darkRadiusMin > lightRadiusMin ? darkRadiusMin : lightRadiusMin
                radiusMax = darkRadiusMax > lightRadiusMax ? darkRadiusMax : lightRadiusMax
        }

        // populate uniforms
        mesh.shader.uniforms.position = [vision.sight.x, vision.sight.y]
        mesh.shader.uniforms.radiusMin = radiusMin
        mesh.shader.uniforms.radiusMax = radiusMax
        mesh.shader.uniforms.intensity = this.intensity
        mesh.blendMode = PIXI.BLEND_MODES.ADD;

        this.addChild(mesh);
        this.meshes.push(mesh);

        // add mask
        if (masked) {
            mesh.mask = this.msk;
        } else {
            this.msk.drawPolygon(vision.sight.polygon);
        }
    }

    async draw() {
        this.clear();

        if (!this.visible) {
            return;
        }

        this.bg.width = (this.w * this.mapScale) + 10;
        this.bg.height = (this.h * this.mapScale) + 10;
        this.bg.position.set(-5, -5);
        this.addChild(this.bg);

        // load shaders
        if (this.vert == null || this.frag == null) {
            this.vert = await Loader.shared.loadResource("/assets/shaders/vision.vert");
            this.frag = await Loader.shared.loadResource("/assets/shaders/vision.frag");
        }

        // cleanup otherwise msk will leak memory
        if(this.msk) {
            this.msk.destroy();
            this.msk = null;
        }

        // create new mask
        // TODO: create custom renderer using stencil buffer
        this.msk = new PIXI.Graphics();
        this.msk.beginFill(0xffffff);

        // tokens
        let activeToken = this.activeToken

        // render active tokens
        if (activeToken) {
            let vision = activeToken.vision
            if (vision != null && vision.sight != null && vision.sight.polygon != null && vision.enabled) {
                this.drawToken(activeToken, VisionType.combined, false)
            }
        } else {
            for(let token of this.tokens) {
                // skip tokens without vision and sight
                let vision = token.vision
                if (vision == null || vision.sight == null || vision.sight.polygon == null || (!vision.enabled && !vision.light)) {
                    continue
                }

                this.drawToken(token, VisionType.combined, false)
            }
        }

        // lights, always visible
        for(let light of this.lights) {
            // check light state
            if (light.sight == null || light.sight.polygon == null || !light.enabled || !light.alwaysVisible) {
                continue
            }

            // create geometry polygon for mesh rendering
            let polygon = this.getGeometry(light.sight.x, light.sight.y, light.sight.polygon)

            // init shaders
            let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

            // create custom mesh from geometry
            let geometry = new PIXI.Geometry()
                .addAttribute('aVertexPosition', polygon);
            let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
            
            // populate uniforms
            mesh.shader.uniforms.position = [light.sight.x, light.sight.y]
            mesh.shader.uniforms.radiusMin = light.radiusMin * this.pixelRatio;
            mesh.shader.uniforms.radiusMax = light.radiusMax * this.pixelRatio;
            mesh.shader.uniforms.intensity = this.intensity;
            mesh.blendMode = PIXI.BLEND_MODES.ADD;

            this.addChild(mesh);
            this.meshes.push(mesh);

            this.msk.drawPolygon(light.sight.polygon);
        }

        this.msk.endFill();

        let maskRequired = false;

        // inactive tokens
        if (activeToken) {
            for(let token of this.tokens) {
                // skip active token
                if (token.id == activeToken.id) {
                    continue
                }
                // skip tokens without vision and light
                let vision = token.vision
                if (vision == null || vision.sight == null || vision.sight.polygon == null || !vision.light) {
                    continue
                }
                
                this.drawToken(token, VisionType.light, true)
            }
        }

        // lights, not always visible
        for(let light of this.lights) {
            // check light state
            if (light.sight == null || light.sight.polygon == null || !light.enabled || light.alwaysVisible) {
                continue
            }

            // create geometry polygon for mesh rendering
            let polygon = this.getGeometry(light.sight.x, light.sight.y, light.sight.polygon)

            // init shaders
            let shader = PIXI.Shader.from(this.vert.data, this.frag.data);

            // create custom mesh from geometry
            let geometry = new PIXI.Geometry()
                .addAttribute('aVertexPosition', polygon);
            let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
            
            // populate uniforms
            mesh.shader.uniforms.position = [light.sight.x, light.sight.y]
            mesh.shader.uniforms.radiusMin = light.radiusMin * this.pixelRatio;
            mesh.shader.uniforms.radiusMax = light.radiusMax * this.pixelRatio;
            mesh.shader.uniforms.intensity = this.intensity;
            mesh.blendMode = PIXI.BLEND_MODES.ADD;

            this.addChild(mesh);
            this.meshes.push(mesh);

            mesh.mask = this.msk;
            
            maskRequired = true
        }
    
        // add mask only when tiles with vision are present
        if (maskRequired) {
            this.addChild(this.msk);
        }

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
        for(let mesh of this.meshes) {
            mesh.destroy();
        }
        this.meshes = [];
        this.removeChildren();
    }
}
