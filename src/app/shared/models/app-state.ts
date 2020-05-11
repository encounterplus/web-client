import { Screen } from './screen';
import { Grid } from 'src/app/core/map/models/grid';
import { Game } from './game';
import { Map} from './map';
import { Creature } from './creature';

export class AppState {
    map: Map;
    game: Game = new Game();
    screen: Screen= new Screen();
    grid: Grid = new Grid();
    isDirty: boolean = false;

    get activeCreatures(): Array<Creature> {
        return this.game.creatures.filter( creature => { return creature.initiative != -10 } ).sort((a, b) => (a.rank > b.rank) ? 1 : -1)
    }

    get mapCreatures(): Array<Creature> {
        return this.game.creatures.filter( creature => {
            return creature.mapId == this.map.id
        });
    }
    
    get turned(): Creature {
        return (this.game.creatures.length > 0 && this.game.creatures.length >= this.game.turn ) ? this.activeCreatures[this.game.turn - 1] : null
    }
    
    get turnedId(): string {
        return this.turned != null && this.turned.id != null ? this.turned.id : "";
    }
}