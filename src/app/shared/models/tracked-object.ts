
export enum TrackedObjectType {
    pointer = "pointer",
    token = "token",
}

export class TrackedObject {
    id: number
    x?: number
    y?: number
    angle?: number
    velocityX?: number
    velocityY?: number
    type?: TrackedObjectType = TrackedObjectType.pointer
    contour?:  Array<number>
}