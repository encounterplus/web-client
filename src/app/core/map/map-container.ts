import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { GridType, Map } from 'src/app/shared/models/map';
import { Layer } from './layers/layer';
import { GridLayer } from './layers/grid-layer';
import { BackgroundLayer } from './layers/background-layer';
import { TokensLayer } from './layers/tokens-layer';
import { Grid, GridInterface } from './models/grid';
import { ProgramManager, VisionLayer } from './layers/vision-layer';
import { LightsLayer } from './layers/lights-layer';
import { DataService } from 'src/app/shared/services/data.service';
import { AppState } from 'src/app/shared/models/app-state';
import { TokenView, ControlState } from './views/token-view';
import { Tile } from 'src/app/shared/models/tile';
import { TilesLayer } from './layers/tiles-layer';
import { AreaEffectsLayer } from './layers/area-effects-layer';
import { AreaEffectView } from './views/area-effect-view';
import { TileView } from './views/tile-view';
import { AurasLayer } from './layers/auras-layer';
import { FogLayer } from './layers/fog-layer';
import { EffectsLayer } from './layers/effects-layer';
import { DrawingsLayer } from './layers/drawings-layer';
import { MarkersLayer } from './layers/markers-layer';
import { MarkerView } from './views/marker-view';
import { Tool } from '../toolbar/toolbar.component';
import { Pointer } from 'src/app/shared/models/pointer';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { v4 as uuidv4 } from 'uuid';
import { Role } from 'src/app/shared/models/token';
import { SquareGrid } from './models/square-grid';
import { HexGrid } from './models/hex-grid';

export class MapContainer extends Layer {

    mapLayer: Layer
    mapTexture: PIXI.RenderTexture

    backgroundLayer: BackgroundLayer;
    gridLayer: GridLayer;
    canvasLayer: Layer;
    areaEffectsLayer: AreaEffectsLayer;
    monstersLayer: TokensLayer;
    playersLayer: TokensLayer;

    topLayer: TilesLayer;
    middleLayer: TilesLayer;
    bottomLayer: TilesLayer;

    aurasLayer: AurasLayer;
    visionLayer: VisionLayer;
    // fogLayer: FogLayer;
    lightsLayer: LightsLayer;
    effectsLayer: EffectsLayer;
    drawingsLayer: DrawingsLayer;
    markersLayer: MarkersLayer;

    // data
    map: Map;
    state: AppState;
    grid: Grid = new SquareGrid()

    data: PIXI.InteractionData
    dragging: boolean = false
    clicked: boolean = false

    activePointer: Pointer
    activeTool: Tool

    turned: TokenView
    msk: PIXI.Graphics
    app: PIXI.Application

    constructor(private dataService: DataService) {
        super();

        this.mapLayer = new Layer()
        this.addChild(this.mapLayer)

        this.backgroundLayer = new BackgroundLayer(this.dataService);
        this.mapLayer.addChild(this.backgroundLayer);
        this.bottomLayer = new TilesLayer(this.dataService)
        this.mapLayer.addChild(this.bottomLayer);
        this.gridLayer = new GridLayer();
        this.mapLayer.addChild(this.gridLayer);
        this.middleLayer = new TilesLayer(this.dataService);
        this.mapLayer.addChild(this.middleLayer);
        this.lightsLayer = new LightsLayer(this.dataService);
        this.addChild(this.lightsLayer);
        this.aurasLayer = new AurasLayer(this.dataService);
        this.addChild(this.aurasLayer);
        this.topLayer = new TilesLayer(this.dataService);
        this.mapLayer.addChild(this.topLayer);
        this.drawingsLayer = new DrawingsLayer(this.dataService);
        this.mapLayer.addChild(this.drawingsLayer);
        this.areaEffectsLayer = new AreaEffectsLayer(this.dataService);
        this.addChild(this.areaEffectsLayer);
        this.markersLayer = new MarkersLayer(this.dataService);
        this.addChild(this.markersLayer);
        this.monstersLayer = new TokensLayer(this.dataService);
        this.addChild(this.monstersLayer);
        this.visionLayer = new VisionLayer(this.dataService);
        this.addChild(this.visionLayer);
        // this.fogLayer = new FogLayer();
        // this.addChild(this.fogLayer);
        this.effectsLayer = new EffectsLayer(this.dataService);
        this.addChild(this.effectsLayer);
        this.playersLayer = new TokensLayer(this.dataService)
        this.addChild(this.playersLayer);

        this.interactive = true;

        this
            .on('pointerup', this.onPointerUp)
            .on('pointerdown', this.onPointerDown)
            .on('pointermove', this.onPointerMove);
    }

    update(state: AppState) {
        this.state = state

        console.debug("updating map")
        this.map = this.state.map

        this.backgroundLayer.update(this.state.map)

        if (this.map == null) {
            return
        }

        // if (this.map.video) {
        //     this.backgroundLayer.once('videoloaded', () => this.draw());
        // }

        // create grid
        if(this.state.map.gridType == GridType.square) {
            this.grid = new SquareGrid()
        } else {
            this.grid = new HexGrid()
        }

        this.grid.update(this.state.map)
        this.gridLayer.update(this.grid)

        this.visionLayer.grid = this.grid
        this.visionLayer.app = this.app
        this.visionLayer.update()
        this.visionLayer.fogLoaded = false

        this.lightsLayer.grid = this.grid
        this.lightsLayer.update()
        
        this.monstersLayer.grid = this.grid
        this.playersLayer.grid = this.grid
        this.updateTokens()
        
        this.areaEffectsLayer.update();
        this.areaEffectsLayer.grid = this.grid;

        this.drawingsLayer.update();

        this.effectsLayer.grid = this.grid;

        this.markersLayer.grid = this.grid;
        this.markersLayer.update();

        this.updateTiles()
    }

    updateTiles() {
        this.bottomLayer.tiles = this.state.map.tiles.filter(tile => tile.layer == "map");
        this.middleLayer.tiles = this.state.map.tiles.filter(tile => tile.layer == "object");
        this.topLayer.tiles = this.state.map.tiles.filter(tile => tile.layer == "token");
    }

    updateTokens() {
        this.monstersLayer.tokens = this.state.map.tokens.filter(token => token.role != Role.friendly)
        this.playersLayer.tokens = this.state.map.tokens.filter(token => token.role == Role.friendly)
    }

    updateTurned(creature: Creature) {
        if (this.turned != null) {
            this.turned.turned = false;
            this.turned.updateLabel();
            this.turned.updateInteraction();
        }

        if (creature == null || creature.tokenId == null) {
            return
        }

        this.turned = this.tokenViewById(creature.tokenId);
        if (this.turned != null) {
            this.turned.turned = true
            this.turned.updateLabel();
            this.turned.updateInteraction();
        }
    }

    updateInteraction() {
        console.log(`updating interaction`);

        for (let view of this.playersLayer.views) {
            view.updateInteraction();
        }

        for (let view of this.monstersLayer.views) {
            view.updateInteraction();
        }
    }

    async drawTiles() {
        this.bottomLayer.size = this.size
        await this.bottomLayer.draw()

        this.middleLayer.size = this.size
        await this.middleLayer.draw()

        this.topLayer.size = this.size
        await this.topLayer.draw()
    }

    async drawTokens() {
        await this.monstersLayer.draw()
        await this.playersLayer.draw()
    }

    async draw() {
        console.debug("drawing map container")

        // preload shaders
        if (ProgramManager.cached.size == 0) {
            await ProgramManager.preload()
        }

        // main background laayer
        await this.backgroundLayer.draw()

        // update size
        this.w = this.backgroundLayer.w
        this.h = this.backgroundLayer.h

        this.mapLayer.size = this.size

        if (this.mapTexture == null || this.mapTexture.width != this.w || this.mapTexture.height != this.h) {
            this.mapTexture = PIXI.RenderTexture.create({width: this.w, height: this.h})
            this.visionLayer.mapTexture = this.mapTexture
        }

        if (this.map == null) {
            this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h)
            return this
        }

        // tiles
        await this.drawTiles()

        // render to texture
        this.app.renderer.render(this.mapLayer, this.mapTexture, true)

        // vision
        this.visionLayer.size = this.size
        this.visionLayer.draw()

        // lights
        this.lightsLayer.size = this.size
        this.lightsLayer.draw()

        // grid
        this.gridLayer.size = this.size
        this.gridLayer.draw()

        this.drawingsLayer.size = this.size
        this.drawingsLayer.draw()

        // tokens
        await this.drawTokens()
    
        // auras
        this.aurasLayer.size = this.size
        this.aurasLayer.tokens = [...this.playersLayer.views,...this.monstersLayer.views];
        this.aurasLayer.draw()
        
        this.areaEffectsLayer.size = this.size
        this.areaEffectsLayer.draw()

        this.markersLayer.size = this.size
        this.markersLayer.draw()
        
        this.effectsLayer.size = this.size
        this.effectsLayer.draw()

        this.hitArea = new PIXI.Rectangle(0, 0, this.w * this.map.scale, this.h * this.map.scale)

        // cleanup otherwise msk will leak memory
        if(this.msk) {
            this.msk.destroy();
            this.msk = null;
        }

        // create new mask
        this.msk = new PIXI.Graphics();
        this.msk.beginFill(0xffffff);
        this.msk.drawRect(0, 0, this.w, this.h)
        this.msk.endFill()

        // apply mask
        this.addChild(this.msk)
        this.mask = this.msk

        return this;
    }

    tokenViewById(id: string): TokenView {
        for (let view of this.playersLayer.views) {
            if (view.token.id == id) {
                return view
            }
        }

        for (let view of this.monstersLayer.views) {
            if (view.token.id == id) {
                return view
            }
        }

        return null
    }

    areaEffectViewById(id: string): AreaEffectView {
        for (let view of this.areaEffectsLayer.views) {
            if (view.areaEffect.id == id) {
                return view
            }
        }
        return null
    }

    tileViewById(id: string): TileView {
        for (let view of this.topLayer.views) {
            if (view.tile.id == id) {
                return view
            }
        }
        for (let view of this.middleLayer.views) {
            if (view.tile.id == id) {
                return view
            }
        }

        for (let view of this.bottomLayer.views) {
            if (view.tile.id == id) {
                return view
            }
        }
        return null
    }

    markerViewById(id: string): MarkerView {
        for (let view of this.markersLayer.views) {
            if (view.marker.id == id) {
                return view
            }
        }
        return null
    }

    onPointerUp(event: PIXI.InteractionEvent) {
        this.dragging = false;

        if (this.activePointer) {
            event.stopPropagation();
            const newPosition = event.data.getLocalPosition(this.parent);

            this.activePointer.x = newPosition.x | 0;
            this.activePointer.y = newPosition.y | 0;
            this.activePointer.state = ControlState.end;

            // send event
            this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});

            // remove pointer
            this.activePointer = null;
        }
    }
    
    onPointerDown(event: PIXI.InteractionEvent) {
        if (event.data.originalEvent.shiftKey || this.activeTool == Tool.pointer) {
            event.stopPropagation();
            this.dragging = true;

            const newPosition = event.data.getLocalPosition(this.parent);

            // check if active pointer is present
            if (this.activePointer) {
                // send event
                this.activePointer.state = ControlState.end;
                this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});
            }

            this.activePointer = new Pointer();
            this.activePointer.id = uuidv4();
            this.activePointer.color = localStorage.getItem("userColor");
            this.activePointer.source = localStorage.getItem("userName");
            this.activePointer.x = newPosition.x | 0;
            this.activePointer.y = newPosition.y | 0;
            this.activePointer.state = ControlState.start;

            // send event
            this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});
            return
        }
    }
    
    onPointerMove(event: PIXI.InteractionEvent) {
        if (this.dragging && this.activePointer) {
            event.stopPropagation();

            const newPosition = event.data.getLocalPosition(this.parent);

            // out of bounds
            if (newPosition.x < 0 || newPosition.x > this.w*this.map.scale || newPosition.y < 0 || newPosition.y > this.h*this.map.scale) {
                this.activePointer.state = ControlState.end;
                // send event
                this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});
                this.activePointer = null;
                return;
            }

            this.activePointer.x = newPosition.x | 0;
            this.activePointer.y = newPosition.y | 0;
            this.activePointer.state = ControlState.control;

            // send event
            this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});
        }
    }
}
