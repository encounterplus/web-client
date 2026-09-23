export enum WallType {
    normal = "normal",
    invisible = "invisible",
    ethereal = "ethereal",
    terrain = "terrain",
    door = "door",
    secretDoor = "secretDoor"
}

export enum WallSide {
    both = "both",
    left = "left",
    right = "right"
}

export enum DoorState {
    closed = "closed",
    open = "open",
    locked = "locked"
}

export interface Wall {
    id: string
    data: Array<number>
    color?: string
    type?: WallType
    side?: WallSide
    door?: DoorState
}