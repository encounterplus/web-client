import { ControlState } from 'src/app/core/map/views/token-view';

export interface Pointer {
    id: string
    x: number
    y: number
    color: string
    source: string
    state: ControlState
}

export function emptyPointer(): Pointer {
    return {
        id: "",
        x: 0,
        y: 0,
        color: "",
        source: "",
        state: ControlState.start,
    }
}
