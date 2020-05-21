import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';

export class TokensLayer extends Layer {

    creatures: Array<Creature> = [];
    views: Array<TokenView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    async draw() {
        this.clear();

        // creaetures
        for (let creature of this.creatures) {
            let tokenView = new TokenView(creature, this.grid, this.dataService);
            this.addChild(tokenView);
            tokenView.draw();

            this.views.push(tokenView);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren();
    }
}