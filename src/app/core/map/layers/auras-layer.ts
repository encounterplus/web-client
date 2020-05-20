import * as PIXI from 'pixi.js';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';

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