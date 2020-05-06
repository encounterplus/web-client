import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { CreatureComponent } from '../../creature/creature.component';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TileView } from '../views/tile-view';
import { AreaEffect } from 'src/app/shared/models/area-effect';
import { AreaEffectView } from '../views/area-effect-view';

export class AreaEffectsLayer extends Layer {

    areaEffects: Array<AreaEffect> = [];
    views: Array<AreaEffectView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    async draw() {
        this.clear();

        // creaetures
        for (let areaEffect of this.areaEffects) {
            let view = new AreaEffectView(areaEffect, this.grid, this.dataService);
            this.addChild(view);
            view.draw();

            this.views.push(view);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}