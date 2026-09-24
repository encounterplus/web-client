import * as PIXI from 'pixi.js';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';

export class AurasLayer extends Layer {

    tokens: Array<TokenView> = [];
    views: Array<PIXI.Container> = [];
    grid!: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    /**
     * Shows the aura containers of the token views it was given.
     *
     * The views fill their own containers as part of their draw — this layer only places them, so
     * that it never starts a second, concurrent draw of a token.
     */
    async draw() {
        this.clear();

        // tokens
        for (let view of this.tokens) {
            this.addChild(view.auraContainer);

            this.views.push(view.auraContainer);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}
