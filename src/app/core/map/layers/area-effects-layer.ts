import { Layer } from './layer';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { AreaEffect } from 'src/app/shared/models/area-effect';
import { AreaEffectView } from '../views/area-effect-view';

export class AreaEffectsLayer extends Layer {

    areaEffects: Array<AreaEffect> = [];
    views: Array<AreaEffectView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    update() {
        this.areaEffects = this.dataService.state.map?.areaEffects || [];
    }

    async draw() {
        this.clear();

        // creaetures
        for (let areaEffect of this.areaEffects) {
            let view = new AreaEffectView(areaEffect, this.grid);
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