import * as PIXI from 'pixi.js';
import { Creature, CreatureType } from 'src/app/shared/models/creature';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { Layer } from './layers/layer';
import { GridLayer } from './layers/grid-layer';
import { BackgroundLayer } from './layers/background-layer';
import { TokensLayer } from './layers/tokens-layer';
import { Grid } from './models/grid';
import { VisionLayer } from './layers/vision-layer';
import { LightsLayer } from './layers/lights-layer';
import { DataService } from 'src/app/shared/services/data.service';
import { AppState } from 'src/app/shared/models/app-state';
import { TokenView } from './views/token-view';
import { Tile } from 'src/app/shared/models/tile';
import { TilesLayer } from './layers/tiles-layer';
import { AreaEffectsLayer } from './layers/area-effects-layer';
import { AreaEffectView } from './views/area-effect-view';
import { TileView } from './views/tile-view';
import { AurasLayer } from './layers/auras-layer';

export class MapContainer extends Layer {

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
    lightsLayer: LightsLayer;

    visionSprite: PIXI.Sprite;

    // data
    
    map: Map;

    state: AppState;

    grid: Grid = new Grid();

    data: PIXI.interaction.InteractionData;
    dragging: boolean;

    turned: TokenView;

    tiles: Array<Tile> = [];

    constructor(private dataService: DataService) {
        super();

        this.backgroundLayer = this.addChild(new BackgroundLayer());
        this.bottomLayer = this.addChild(new TilesLayer(this.dataService));
        this.gridLayer = this.addChild(new GridLayer());
        this.middleLayer = this.addChild(new TilesLayer(this.dataService));
        this.lightsLayer = this.addChild(new LightsLayer());
        this.aurasLayer = this.addChild(new AurasLayer(this.dataService));
        this.topLayer = this.addChild(new TilesLayer(this.dataService));
        this.areaEffectsLayer = this.addChild(new AreaEffectsLayer(this.dataService));
        this.monstersLayer = this.addChild(new TokensLayer(this.dataService));
        this.visionLayer = this.addChild(new VisionLayer());
        this.playersLayer = this.addChild(new TokensLayer(this.dataService));
    }

    update(state: AppState) {
        this.state = state;

        console.debug("updating map");
        this.map = this.state.map;

        if (this.map == null) {
            return;
        }

        this.backgroundLayer.update(this.state.map);

        // update grid
        this.grid.update(this.state.map);
        this.gridLayer.update(this.grid);

        this.lightsLayer.updateCreatures(this.state.mapCreatures);
        this.lightsLayer.updateTiles(this.state.map.tiles);
        this.lightsLayer.visible = this.state.map.lineOfSight;
        this.visionLayer.updateCreatures(this.state.mapCreatures);
        this.visionLayer.updateTiles(this.state.map.tiles);
        this.visionLayer.visible = this.state.map.lineOfSight;
        this.monstersLayer.creatures = this.state.mapCreatures.filter(creature => creature.type != CreatureType.player);
        this.monstersLayer.grid = this.grid;
        this.playersLayer.creatures = this.state.mapCreatures.filter(creature => creature.type == CreatureType.player);
        this.playersLayer.grid = this.grid;

        this.areaEffectsLayer.areaEffects = this.state.map.areaEffects;
        this.areaEffectsLayer.grid = this.grid;
        // this.tokensLayer.updateCreatures(this.state.mapCreatures);
        // this.tokensLayer.updateTiles(this.state.map.tiles);

        this.tiles = state.map.tiles;
    }

    updateTiles(tiles: Array<Tile>) {
        this.tiles = tiles;
    }

    updateTurned(creature: Creature) {
        if (this.turned != null) {
            this.turned.turned = false;
            this.turned.updateUID();
        }

        this.turned = this.tokenByCreature(creature);
        if (this.turned != null) {
            this.turned.turned = true
            this.turned.updateUID();
        }
    }

    async drawTiles() {
        // this.bottomLayer.clear();
        // this.middleLayer.clear();
        // this.topLayer.clear();

        this.bottomLayer.tiles = this.tiles.filter(tile => tile.layer == "map");
        this.middleLayer.tiles = this.tiles.filter(tile => tile.layer == "object");
        this.topLayer.tiles = this.tiles.filter(tile => tile.layer == "token");

        await this.bottomLayer.draw();
        await this.middleLayer.draw();
        await this.topLayer.draw();
    }

    async draw() {
        await this.backgroundLayer.draw();

        this.w = this.backgroundLayer.w;
        this.h = this.backgroundLayer.h;

        this.visionLayer.w = this.w;
        this.visionLayer.h = this.h;

        // vision
        await this.visionLayer.draw();

        await this.gridLayer.draw();
        await this.lightsLayer.draw();

        await this.monstersLayer.draw();
        
        await this.playersLayer.draw();
        this.aurasLayer.tokens = this.playersLayer.views;
        this.aurasLayer.draw();
        await this.drawTiles();

        await this.areaEffectsLayer.draw();

        // this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        // this.interactive = true;
        // this.buttonMode = true;

        // this
        //     .on('pointerdown', this.onDragStart)
        //     .on('pointerup', this.onDragEnd)
        //     .on('pointerupoutside', this.onDragEnd)
        //     .on('pointermove', this.onDragMove);

        return this;
    }

    tokenByCreature(creature: Creature): TokenView {
        if (creature) {
            return this.tokenByCreatureId(creature.id)
        } else {
            return null;
        }
    }

    tokenByCreatureId(creatureId: String): TokenView {

        for (let token of this.playersLayer.views) {
            if (token.creature.id == creatureId) {
                return token;
            }
        }

        for (let token of this.monstersLayer.views) {
            if (token.creature.id == creatureId) {
                return token;
            }
        }

        return null;
    }

    areaEffectViewById(id: String): AreaEffectView {
        for (let model of this.areaEffectsLayer.views) {
            if (model.areaEffect.id == id) {
                return model;
            }
        }
        return null;
    }

    tileViewById(id: String): TileView {
        for (let model of this.topLayer.views) {
            if (model.tile.id == id) {
                return model;
            }
        }
        for (let model of this.middleLayer.views) {
            if (model.tile.id == id) {
                return model;
            }
        }

        for (let model of this.bottomLayer.views) {
            if (model.tile.id == id) {
                return model;
            }
        }
        return null;
    }

    onDragStart(event: PIXI.interaction.InteractionEvent) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.dragging = true;
    }
    
    onDragEnd() {
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
    }
    
    onDragMove() {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(this.parent);
            this.x += this.data.global.x - this.x;
            this.y += this.data.global.y - this.y;
        }
    }
}