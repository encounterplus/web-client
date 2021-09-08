
export enum TrackedObjectType {
    pointer = "pointer",
    token = "token",
}

export class TrackedObject {
    id: number
    typeId?: number
    categoryId?: number
    x?: number
    y?: number
    angle?: number
    velocityX?: number
    velocityY?: number
    type?: TrackedObjectType = TrackedObjectType.pointer
    contour?:  Array<number>

    get trackingId(): number {
        if ((this.typeId || 0) != 0) {
            return this.typeId || 0
        } else {
            return this.id
        }
    }
}