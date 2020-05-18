export enum WSEventName {
    gameUpdated = "gameUpdated",
    mapUpdated = "mapUpdated",
    creatureUpdated = "creatureUpdated",
    tileUpdated = "tileUpdated",
    areaEffectUpdated = "areaEffectUpdated",
    creatureMoved = "creatureMoved",
    tileMoved = "tileMoved",
    areaEffectMoved = "areaEffectMoved",
    fogUpdated = "fogUpdated",
    pointerUpdated = "pointerUpdated",
    pointerMoved = "pointerMoved",
    interactionUpdated = "interactionUpdated",
    screenUpdated = "screenUpdated",
    drawingsUpdated = "drawingsUpdated",
    clientUpdated = "clientUpdated",
    mapLoaded = "mapLoaded",
    reload = "reload"
}

export interface WSEvent {
    name: WSEventName;
    data: any;
}