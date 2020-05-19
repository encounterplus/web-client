import { Creature, CreatureType } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TileView } from '../views/tile-view';
import { Drawing, DrawingShape } from 'src/app/shared/models/drawing';
import { Graphics, BLEND_MODES } from 'pixi.js';
import { MarkerView } from '../views/marker-view';
import { Marker } from 'src/app/shared/models/marker';

export class MarkersLayer extends Layer {
    markers: Array<Marker> = [];
    views: Array<MarkerView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    update() {
        this.markers = this.dataService.state.map?.markers || [];
    }

    async draw() {
        this.clear();

        // tiles
        for (let marker of this.markers) {
            let markerView = new MarkerView(marker, this.grid);
            this.addChild(markerView);
            markerView.draw();

            this.views.push(markerView);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}