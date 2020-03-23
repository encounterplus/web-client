import { ScreenConfig } from './screen-config';
import { Grid } from 'src/app/core/map/models/grid';
import { Game } from './game';
import { Map} from './map';

export class AppState {
    map: Map;
    game: Game = new Game();
    config: ScreenConfig = new ScreenConfig();
    grid: Grid = new Grid();
    isDirty: boolean = false;
}