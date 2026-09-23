import { Layer } from './layer';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TileView } from '../views/tile-view';
import { MapLayer } from 'src/app/shared/models/map';

export class TilesLayer extends Layer {
    tiles: Array<Tile> = [];
    views: Array<TileView> = [];
    grid!: Grid;

    /** Bumped by `clear()`, so a draw still loading tiles stops once it has been superseded. */
    private generation = 0;

    constructor(private dataService: DataService) {
        super();
        this.sortableChildren = true
    }

    async draw() {
        this.clear();
        const generation = this.generation;

        // tiles
        for (let tile of this.tiles) {
            if (tile.layer == MapLayer.dm) {
                continue;
            }
            let tileView = new TileView(tile, this.grid);
            this.addChild(tileView);
            // tracked before it loads, so a clear() meanwhile disposes it too
            this.views.push(tileView);
            await tileView.draw();

            if (generation != this.generation) {
                return this;
            }
        }

        return this;
    }

    clear() {
        this.generation += 1;
        this.views.forEach(view => view.dispose())
        this.views = []
        this.removeChildren();
    }
}