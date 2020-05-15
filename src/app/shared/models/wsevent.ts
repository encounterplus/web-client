export enum WSEventName {
    gameUpdate = "gameUpdate",
    mapUpdate = "mapUpdate",
    creatureUpdate = "creatureUpdate",
    tileUpdate = "tileUpdate",
    areaEffectUpdate = "areaEffectUpdate",
    creatureMove = "creatureMove",
    tileMove = "tileMove",
    areaEffectMove = "areaEffectMove",
    fogUpdate = "fogUpdate",
    pointerUpdate = "pointerUpdate",
    pointerMove = "pointerMove",
    interactionUpdate = "interactionUpdate",
    drawingsUpdate = "drawingsUpdate",
    userUpdate = "userUpdate",
    mapLoad = "mapLoad",
    reload = "reload"
}

export interface WSEvent {
    name: WSEventName;
    data: any;
}