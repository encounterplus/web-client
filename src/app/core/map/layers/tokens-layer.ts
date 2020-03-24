import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { TokenView } from '../views/token-view';
import { Grid } from '../models/grid';
import { CreatureComponent } from '../../creature/creature.component';

export class TokensLayer extends Layer {

    creatures: Array<Creature> = [];
    tokens: Array<TokenView> = [];

    selected: TokenView;
    turned: TokenView;

    grid: Grid;

    updateCreatures(creatures: Array<Creature>) {
        this.creatures = creatures;
    }

    updateTurned(creature: Creature) {
        if (this.turned != null) {
            this.turned.turned = false;
            this.turned.updateUID();
        }

        this.turned = this.tokenByCreature(creature);
        if (this.turned != null) {
            this.turned.turned = true
            this.turned.updateUID();
        }
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

    tokenByCreature(creature: Creature): TokenView {
        return this.tokenByCreatureId(creature.id)
    }

    tokenByCreatureId(creatureId: String): TokenView {
        for (let token of this.tokens) {
            if (token.creature.id == creatureId) {
                return token;
            }
        }

        return null;
    }
}