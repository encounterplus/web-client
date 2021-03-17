import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { TokenView } from '../views/token-view';
import { Grid, GridInterface } from '../models/grid';
import { DataService } from 'src/app/shared/services/data.service';
import { Token } from 'src/app/shared/models/token';

export class TokensLayer extends Layer {

    tokens: Array<Token> = [];
    views: Array<TokenView> = [];
    grid: Grid;

    constructor(private dataService: DataService) {
        super();
    }

    async draw() {
        this.clear();

        // creaetures
        for (let token of this.tokens) {
            let tokenView = new TokenView(token, this.grid, this.dataService);
            this.addChild(tokenView);
            tokenView.draw();

            this.views.push(tokenView);
        }

        return this;
    }

    clear() {
        this.views = []
        this.removeChildren()
    }
}