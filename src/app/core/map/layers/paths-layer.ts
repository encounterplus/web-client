import * as PIXI from 'pixi.js';
import { Layer } from './layer';
import { Grid } from '../models/grid';
import { GridSize, TokenView } from '../views/token-view';

export class PathsLayer extends Layer {
    grid: Grid;

    alphaFilter = new PIXI.filters.AlphaFilter();

    tokens: Array<TokenView> = []
    views: Array<PIXI.Container> = []

    constructor() {
        super();
        this.alphaFilter.alpha = 0.4
    }

    async draw() {
        this.clear()

        // clear path
        for (let view of this.views) {
            this.removeChild(view)
        }
        
        // this.views.

        // tokens
        for (let view of this.tokens) {
            view.pathView.filters = [this.alphaFilter]
            // view.pathView.alpha = 0.4
            this.addChild(view.pathView)
            this.views.push(view.pathView)

        }
        return this;
    }

    clear() {
        this.views = []
        this.removeChildren()
    }

}
