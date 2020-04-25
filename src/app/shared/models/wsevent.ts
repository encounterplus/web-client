export enum WSEventName {
    gameUpdate = "gameUpdate",
    creatureUpdate = "creatureUpdate",
    creatureMove = "creatureMove",
}

export interface WSEvent {
    name: WSEventName;
    data: any;
}