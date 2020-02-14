import { Game } from './game';
import { Map } from './map';
import { ScreenConfig } from './screen-config';

export class ApiData {
    version: string;
    build: number;
    map: Map;
    game: Game = new Game();
    config: ScreenConfig;
}
