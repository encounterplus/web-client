import { Game } from './game';
import { Map } from './map';
import { Screen } from './screen';
import { Message } from './message';

export class ApiData {
    version: string;
    build: number;
    map: Map;
    game: Game = new Game();
    screen: Screen;
    messages: Array<Message> = [];
}
