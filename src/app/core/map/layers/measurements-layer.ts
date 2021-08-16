import { Layer } from './layer';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Measurement } from 'src/app/shared/models/measurement';
import { MeasurementView } from '../views/measurement-view';

export class MeasurementsLayer extends Layer {

    measurements: Array<Measurement> = [];
    views: Array<MeasurementView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    update() {
        this.measurements = this.dataService.state.map?.measurements || [];
    }

    async draw() {
        this.clear();

        // creaetures
        for (let model of this.measurements) {
            let view = new MeasurementView(model, this.grid);
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