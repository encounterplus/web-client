import { Layer } from './layer';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TileView } from '../views/tile-view';
import { MapLayer } from 'src/app/shared/models/map';

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
            if (tile.layer == MapLayer.dm) {
                return;
            }
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