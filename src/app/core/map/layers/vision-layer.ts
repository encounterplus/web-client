import * as PIXI from 'pixi.js'
import { Layer } from './layer'
import { Loader } from '../models/loader'
import { DataService } from 'src/app/shared/services/data.service'
import { Role, Size, Token } from 'src/app/shared/models/token'
import { Light } from 'src/app/shared/models/light'
import { Grid } from '../models/grid'
import { VisionType } from 'src/app/shared/models/vision'
import { CacheManager, ProgramManager, Utils } from 'src/app/shared/utils'
import { Tile } from 'src/app/shared/models/tile'
import { SharedVision } from 'src/app/shared/models/screen'

export class VisionLayer extends Layer {
    tokens: Array<Token> = []
    tiles: Array<Tile> = []
    lights: Array<Light> = []

    intensity: number = 1.0
    visionLimit: number = -1
    // mapScale: number = 1.0

    // gridSize: number = 50.0
    // gridScale: number = 5.0

    grid: Grid

    baseFogTexture: PIXI.Texture
    visionContainer: PIXI.Container
    visionTexture: PIXI.RenderTexture
    fogTexture: PIXI.RenderTexture
    mapTexture: PIXI.RenderTexture
    tmpTexture: PIXI.RenderTexture
    fogBlurTexture: PIXI.RenderTexture
    visionBlurTexture: PIXI.RenderTexture

    fog: string
    fogOfWar = false
    fogExplore = false
    fogLoaded = false
    lineOfSight = false

    bg: PIXI.Sprite
    meshes: Array<PIXI.Mesh> = []
    msk: PIXI.Graphics
    app: PIXI.Application
    blurFilter: PIXI.Filter
    blur: boolean = false

    get activeToken(): Token {
        // no active token shared vision is always
        if (this.dataService.state.screen.sharedVision == SharedVision.always) {
            return null
        }

        // get userTokenId from storage
        let userTokenId = localStorage['userTokenId']

        // check for empty user token or `null` string
        if (userTokenId && userTokenId != "null") {
            if (this.dataService.state.screen.sharedVision == SharedVision.never) {
                // search using userTokenId
                for (let token of this.dataService.state.map.tokens) {
                    if (token.id == userTokenId) {
                        return token
                    }
                }
                return null
            } else if (this.dataService.state.screen.sharedVision == SharedVision.partial) {
                // outside of turn
                if (!this.dataService.state.game.started || this.dataService.state.turned?.tokenId != userTokenId) {
                    return null
                }
                // search using userTokenId
                for (let token of this.dataService.state.map.tokens) {
                    if (token.id == userTokenId) {
                        return token
                    }
                }
                return null
            }
            
        } else {
            // outside of turn
            if (!this.dataService.state.game.started) {
                return null
            }

            // search using creature tokenId
            for (let token of this.dataService.state.map.tokens) {
                if (token.id == this.dataService.state.turned?.tokenId) {

                    return token
                }
            }
            return null
        }
        return null
    }

    constructor(private dataService: DataService) {
        super();

        this.blurFilter = new PIXI.filters.BlurFilter(3, 1, 0.5, 5)

        this.visionContainer = new PIXI.Container()
    }

    update() {
        this.tokens = this.dataService.state.map.tokens
        this.tiles = this.dataService.state.map.tiles
        this.lights = this.dataService.state.map.lights

        this.lineOfSight = this.dataService.state.map.lineOfSight
        this.fogOfWar = this.dataService.state.map.fogOfWar

        this.fog = this.dataService.state.map.fog
        this.fogExplore = this.dataService.state.map.fogExploration
        
        this.visionLimit = this.dataService.state.map.losVisionLimit || -1
        this.intensity = this.dataService.state.map.losDaylight || 0.0

        this.visible = this.lineOfSight || this.fogOfWar

        // clear cache
        CacheManager.sightPolygon.clear()
        CacheManager.geometryPolygon.clear()

        // do we need blur?
        this.blur = (localStorage.getItem("softEdges") || "true") == "true"

        this.visionContainer.filters = this.blur && this.lineOfSight ? [this.blurFilter] : null
    }

    async draw() {
        this.clear();

        if (!this.visible) {
            return;
        }

        // prevent showing map while loading textures
        if (this.fog && !this.fogLoaded) {
            this.bg = new PIXI.Sprite(PIXI.Texture.WHITE)
            this.bg.width = this.w
            this.bg.height = this.h
            this.bg.tint = 0x000000;

            this.addChild(this.bg)
        }
        
        // console.time('visionDraw')

        this.visionContainer.width = Math.ceil(this.w / 2)
        this.visionContainer.height = Math.ceil(this.h / 2)

        // this.addChild(this.visionContainer);

        if (this.visionTexture == null || this.visionTexture.width != Math.ceil(this.w / 2) || this.visionTexture.height != Math.ceil(this.h / 2)) {
            this.visionTexture = PIXI.RenderTexture.create({width: Math.ceil(this.w / 2), height: Math.ceil(this.h / 2)})
            this.visionBlurTexture = PIXI.RenderTexture.create({width: Math.ceil(this.w / 2), height: Math.ceil(this.h / 2)})
            console.debug("creating vision texture");
        }

        if (this.fogTexture == null || this.fogTexture.width != Math.ceil(this.w / 2) || this.fogTexture.height != Math.ceil(this.h / 2)) {
            this.fogTexture = PIXI.RenderTexture.create({width: Math.ceil(this.w / 2), height: Math.ceil(this.h / 2)})
            this.fogBlurTexture = PIXI.RenderTexture.create({width: Math.ceil(this.w / 2), height: Math.ceil(this.h / 2)})
            console.debug("creating fog texture");
        }

        if (this.tmpTexture == null || this.tmpTexture.width != Math.ceil(this.w / 2) || this.tmpTexture.height != Math.ceil(this.h / 2)) {
            this.tmpTexture = PIXI.RenderTexture.create({width: Math.ceil(this.w / 2), height: Math.ceil(this.h / 2)})
            console.debug("creating tmp texture");
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

        // active token
        let activeToken = this.activeToken

        // HOTFIX: check vision data for active token
        if (activeToken && activeToken.role == Role.friendly && activeToken.vision && activeToken.vision.sight && activeToken.vision.sight.polygon) {
        } else {
            activeToken = null
        }

        // render active tokens
        
        if (activeToken) {
            const vision = activeToken.vision
            if (vision != null && vision.sight != null && vision.sight.polygon != null && vision.enabled) {
                this.drawToken(activeToken, VisionType.combined, false)
            }
        } else {
            for(let token of this.tokens) {
                // skip tokens without vision and sight
                const vision = token.vision
                if (vision == null || vision.sight == null || vision.sight.polygon == null) {
                    continue
                }

                if (vision.enabled) {
                    this.drawToken(token, VisionType.combined, false)
                } else if (vision.light) {
                    this.drawToken(token, VisionType.light, false)
                }
            }
        }

        // tiles, always visible
        for(let tile of this.tiles) {
            // check light state
            const light = tile.light
            if (light == null || !light.alwaysVisible || !light.enabled || light.sight == null || light.sight.polygon == null) {
                continue
            }

            this.drawTile(tile, false)
        }

        // lights, always visible
        for(let light of this.lights) {
            // check light state
            if (!light.alwaysVisible || !light.enabled || light.sight == null || light.sight.polygon == null) {
                continue
            }

            this.drawLight(light, false)
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
                const vision = token.vision
                if (vision == null || vision.sight == null || vision.sight.polygon == null || !vision.light || this.visionLimit >= 0 ) {
                    continue
                }
                
                this.drawToken(token, VisionType.light, true)
            }
        }

        // tiles, not always visible
        for(let tile of this.tiles) {
            // check light state
            const light = tile.light
            if (light == null || light.alwaysVisible || !light.enabled || light.sight == null || light.sight.polygon == null || this.visionLimit >= 0) {
                continue
            }

            this.drawTile(tile, true)
            maskRequired = true
        }

        // lights, not always visible
        for(let light of this.lights) {
            // check light state
            if (light.alwaysVisible || !light.enabled || light.sight == null || light.sight.polygon == null || this.visionLimit >= 0) {
                continue
            }

            this.drawLight(light, true)
            maskRequired = true
        }
    
        // add mask only when tiles with vision are present
        if (maskRequired) {
            this.visionContainer.addChild(this.msk);
        }

        // render to texture
        if (this.lineOfSight || (this.fogOfWar && this.fogExplore)) {
            this.app.renderer.render(this.visionContainer, {renderTexture: this.visionTexture, clear: true})
        } 

        // load texture if necessary
        if (this.fogOfWar && !this.fogLoaded) {
            await this.updateFogFromTexture(this.fog)
        }
        
        // bake vision into fog texture
        if (this.fogOfWar) {
            this.updateFog()
        }

        // blur like a boss?
        if (this.blur && !this.lineOfSight && this.fogOfWar && this.fogExplore) {
            let sprite = new PIXI.Sprite(this.fogTexture)
            sprite.filters = [this.blurFilter]
            this.app.renderer.render(sprite, {renderTexture: this.fogBlurTexture, clear: true})
        }

        // init shader
        const shader = new PIXI.Shader(ProgramManager.cached.get("map"))

        let geometry = new PIXI.Geometry();
        geometry.addAttribute(
            'aVertexPosition',
                [0, 0, // x, y
                this.w, 0, // x, y
                this.w, this.h,
                0, this.h], // x, y
            2);
        geometry
            .addAttribute('aTextureCoord', [0, 0, 1, 0, 1, 1, 0, 1], 2)
            .addIndex([0, 1, 2, 0, 2, 3]);

        let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)

        // bleh
        let texVision: PIXI.Texture
        if (this.lineOfSight && !this.fogOfWar) {
            texVision = this.visionTexture
        } else if (!this.lineOfSight && this.fogOfWar) {
            texVision = this.blur && this.fogExplore ? this.fogBlurTexture : this.fogTexture
        } else if (this.lineOfSight && this.fogOfWar) {
            texVision = this.fogTexture
        }
            
        // populate uniforms
        mesh.shader.uniforms.texMap = this.mapTexture
        mesh.shader.uniforms.texVision = texVision
        mesh.shader.uniforms.fog = this.fogOfWar
        mesh.shader.uniforms.los = this.lineOfSight

        // workaround to fix bleading edges in exploration mode
        // mesh.filters = this.blur && !this.lineOfSight && this.fogOfWar && this.fogExplore ? [this.blurFilter] : null

        this.addChild(mesh);

        // console.timeEnd('visionDraw')
        
        if (this.bg != null) {
            this.bg.visible = false
            this.removeChild(this.bg)
            this.bg = null
        }
        return this;
    }

    drawToken(token: Token, type: VisionType, masked: boolean) {
        const vision = token.vision

        // check vision state
        if (vision == null || vision.sight == null || vision.sight.polygon == null || vision.sight.polygon.length == 0) {
            return
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
            // this might be better triangle filling function
            // let geometryPolygon = PIXI.utils.earcut (sightPolygon, null, 2);
            // console.debug(geometryPolygon)

            // update cache
            CacheManager.geometryPolygon.set(vision.id, geometryPolygon)
        }

        // init shaders
        const shader = new PIXI.Shader(ProgramManager.cached.get("vision"))

        // create custom mesh from geometry
        const geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', geometryPolygon);

        const mesh = new PIXI.Mesh((geometry as any) as PIXI.Geometry, <PIXI.MeshMaterial>shader)
 
        const size = this.grid.sizeFromGridSize(Size.toGridSize(token.size))
        const minSize = Math.max(size.width, size.height) / 2.0

        // temporary radius
        const lightRadiusMin = vision.light ? (vision.lightRadiusMin * this.grid.pixelRatio) + minSize : 0
        const lightRadiusMax = vision.light ? (vision.lightRadiusMax * this.grid.pixelRatio) + minSize : 0
        const darkRadiusMin = vision.dark ? (vision.darkRadiusMin * this.grid.pixelRatio) + minSize : 0
        const darkRadiusMax = vision.dark ? (vision.darkRadiusMax * this.grid.pixelRatio) + minSize : 0

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

        // // vision limit
        // const limit = this.visionLimit * this.grid.pixelRatio
        // if (limit >= 0) {
        //     radiusMin = Math.min(radiusMin, limit)
        //     radiusMax = Math.min(radiusMax, limit)
        // }

        // populate uniforms
        mesh.shader.uniforms.position = [vision.sight.x / 2, vision.sight.y / 2]
        mesh.shader.uniforms.radiusMin = radiusMin / 2
        mesh.shader.uniforms.radiusMax = Math.max(radiusMin, radiusMax) / 2
        mesh.shader.uniforms.intensity = this.intensity
        // mesh.blendMode = PIXI.BLEND_MODES.ADD;

        this.visionContainer.addChild(mesh);
        this.meshes.push(mesh);

        // add mask
        if (masked) {
            mesh.mask = this.msk;
        } else {
            // performance hog
            this.msk.drawPolygon(sightPolygon)
        }
    }

    drawTile(tile: Tile, masked: boolean) {
        //   light
        const light = tile.light

        // check light state
        if (light.sight == null || light.sight.polygon == null || !light.enabled || light.sight.polygon.length == 0) {
            return
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
        let shader = new PIXI.Shader(ProgramManager.cached.get("vision"))

        // create custom mesh from geometry
        let geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', geometryPolygon);
        let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)

        const minSize = Math.max(tile.width, tile.height) / 2.0
        
        // populate uniforms
        mesh.shader.uniforms.position = [light.sight.x / 2, light.sight.y / 2]
        mesh.shader.uniforms.radiusMin = ((light.radiusMin * this.grid.pixelRatio) + minSize) / 2;
        mesh.shader.uniforms.radiusMax = ((Math.max(light.radiusMin, light.radiusMax) * this.grid.pixelRatio) + minSize) / 2;
        mesh.shader.uniforms.intensity = this.intensity;
        // mesh.blendMode = PIXI.BLEND_MODES.ADD;

        this.visionContainer.addChild(mesh);
        this.meshes.push(mesh);

        // add mask
        if (masked) {
            mesh.mask = this.msk;
        } else {
            // performance hog
            this.msk.drawPolygon(sightPolygon)
        }
    }

    drawLight(light: Light, masked: boolean) {
        // check light state
        if (light.sight == null || light.sight.polygon == null || !light.enabled || light.sight.polygon.length == 0) {
            return
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
        let shader = new PIXI.Shader(ProgramManager.cached.get("vision"))

        // create custom mesh from geometry
        let geometry = new PIXI.Geometry()
            .addAttribute('aVertexPosition', geometryPolygon);
        let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
        
        // populate uniforms
        mesh.shader.uniforms.position = [light.sight.x / 2, light.sight.y / 2]
        mesh.shader.uniforms.radiusMin = light.radiusMin * this.grid.pixelRatio / 2;
        mesh.shader.uniforms.radiusMax = Math.max(light.radiusMin, light.radiusMax) * this.grid.pixelRatio / 2;
        mesh.shader.uniforms.intensity = this.intensity;
        // mesh.blendMode = PIXI.BLEND_MODES.ADD;

        this.visionContainer.addChild(mesh);
        this.meshes.push(mesh);

        // add mask
        if (masked) {
            mesh.mask = this.msk;
        } else {
            // performance hog
            this.msk.drawPolygon(sightPolygon)
        }
    }

    updateFog() {
        // init shaders
        const shader = new PIXI.Shader(ProgramManager.cached.get("fog"))

        let geometry = new PIXI.Geometry();
        geometry.addAttribute(
            'aVertexPosition',
                [0, 0, // x, y
                Math.ceil(this.w / 2), 0, // x, y
                Math.ceil(this.w / 2), Math.ceil(this.h / 2),
                0, Math.ceil(this.h / 2)], // x, y
            2);
        geometry
            .addAttribute('aTextureCoord', [0, 0, 1, 0, 1, 1, 0, 1], 2)
            .addIndex([0, 1, 2, 0, 2, 3]);

        let mesh = new PIXI.Mesh(geometry, <PIXI.MeshMaterial>shader)
            
        // // populate uniforms
        mesh.shader.uniforms.texFog = this.fogTexture
        mesh.shader.uniforms.texVision = this.visionTexture
        mesh.shader.uniforms.exploration = this.fogExplore

        this.app.renderer.render(mesh, {renderTexture: this.tmpTexture, clear: true})
        
        // gpu texture copy function?
        // texture swap
        let tmp = this.fogTexture
        this.fogTexture = this.tmpTexture
        this.tmpTexture = tmp

        // debug
        // let sprite = new PIXI.Sprite(this.fogTexture)
        // sprite.width = this.w
        // sprite.height = this.h
        // this.addChild(sprite)

        // let sprite = new PIXI.Sprite(this.visionTexture)
        // this.app.renderer.render(sprite, this.fogTexture, false)
    }

    async updateFogFromData(fogData: string) {
        console.debug("loading fog from data")

        if (this.fog == null) {
            return this
        }

        // render offscreen
        const fogTexture = await Loader.shared.loadTextureBase64(Utils.generateUniqueId(), fogData)

        if(fogTexture == null) {
            return this
        }

        let sprite = new PIXI.Sprite(fogTexture)
        sprite.filters = this.blur ? [this.blurFilter] : null

         // render offscreen
        this.app.renderer.render(sprite, {renderTexture: this.fogTexture, clear: true})

        sprite.destroy()
        PIXI.BaseTexture.removeFromCache(fogTexture.baseTexture.textureCacheIds[1]);
        PIXI.Texture.removeFromCache(fogTexture.textureCacheIds[1]);
        fogTexture.destroy(true);

        this.fogLoaded = true

        this.draw()
    }

    async updateFogFromTexture(fog: string) {
        console.debug("loading fog from texture")
        if (this.fog == null) {
            return this
        }

        // skip if base fog texture exists and it's same
        if (this.baseFogTexture == null) {
            console.debug("loading fog texture")
            this.baseFogTexture = await Loader.shared.loadTexture(this.fog)
        }

        if(this.baseFogTexture == null) {
            console.error("empty fog texture")
            return this
        }

        let sprite = new PIXI.Sprite(this.baseFogTexture)
        sprite.filters = this.blur ? [this.blurFilter] : null

        // render offscreen
        this.app.renderer.render(sprite, {renderTexture: this.fogTexture, clear: true})

        sprite.destroy()
        // PIXI.BaseTexture.removeFromCache(fogTexture.baseTexture.textureCacheIds[1]);
        // PIXI.Texture.removeFromCache(fogTexture.textureCacheIds[1]);
        // fogTexture.destroy(true);

        this.fogLoaded = true
    }

    getGeometry(x: number, y: number, polygon: Array<number>) {
        let origin = [x, y]
        var buffer = [];
        for (let i = 0; i < polygon.length - 1; i = i + 2) {
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
            mesh.destroy()
        }
        this.meshes = [];
        this.visionContainer.removeChildren()
        this.removeChildren();
    }
}
