import { Creature, CreatureType } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TileView } from '../views/tile-view';

export class TilesLayer extends Layer {
    tiles: Array<Tile> = [];
    views: Array<TileView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
        this.sortableChildren = true
    }

    async draw() {
        this.clear();

        // tiles
        for (let tile of this.tiles) {
            let tileView = new TileView(tile, this.grid);
            this.addChild(tileView);
            tileView.draw();

            this.views.push(tileView);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}