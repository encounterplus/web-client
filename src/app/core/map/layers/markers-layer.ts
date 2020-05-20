import { Layer } from './layer';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
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