import { Layer } from './layer';
import { Grid } from '../models/grid';

export class GridLayer extends Layer {
    grid: Grid;


    update(grid: Grid) {
        this.grid = grid;
    }

    async draw() {
        this.clear()

        if (this.grid.visible) {
            this.addChild(this.grid.gridGraphics(this.w, this.h))
        }

        return this;
    }

    clear() {
        this.removeChildren();
    }
}
