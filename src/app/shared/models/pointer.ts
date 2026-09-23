import { ControlState } from 'src/app/core/map/views/token-view';

export class Pointer {
    id: string = "";
    x: number = 0;
    y: number = 0;
    color: string = "";
    source: string = "";
    state: ControlState = ControlState.start;
}