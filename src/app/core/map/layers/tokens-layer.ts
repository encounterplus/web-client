import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';

export class TokensLayer extends Layer {

    creatures: Array<Creature> = [];
    tokens: Array<TokenView> = [];
    
    grid: Grid;

    update(creatures: Array<Creature>) {
        this.creatures = creatures;
    }

    async draw() {
        this.clear();

        for (let creature of this.creatures) {
            let tokenView = new TokenView(creature, this.grid);
            this.addChild(tokenView);
            await tokenView.draw();

            this.tokens.push(tokenView);
        }

        return this;
    }

    clear() {
        this.tokens = []
        this.removeChildren();
    }
}