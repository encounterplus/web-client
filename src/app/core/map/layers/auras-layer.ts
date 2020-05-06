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

export class AurasLayer extends Layer {

    tokens: Array<TokenView> = [];
    views: Array<PIXI.Container> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    async draw() {
        this.clear();

        // creaetures
        for (let view of this.tokens) {
            this.addChild(view.auraContainer);
            view.draw();

            this.views.push(view.auraContainer);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}