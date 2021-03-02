export enum WSEventName {
    gameUpdated = "gameUpdated",
    mapUpdated = "mapUpdated",
    creatureUpdated = "creatureUpdated",
    tileUpdated = "tileUpdated",
    tilesUpdated = "tilesUpdated",
    lightUpdated = "lightUpdated",
    lightsUpdated = "lightsUpdated",
    areaEffectUpdated = "areaEffectUpdated",
    areaEffectsUpdated = "areaEffectsUpdated",
    markerUpdated = "markerUpdated",
    markersUpdated = "markersUpdated",
    tokenUpdated = "tokenUpdated",
    tokensUpdated = "tokensUpdated",
    tokenMoved = "tokenMoved",
    tileMoved = "tileMoved",
    areaEffectMoved = "areaEffectMoved",
    markerMoved = "markerMoved",
    fogUpdated = "fogUpdated",
    pointerUpdated = "pointerUpdated",
    pointerMoved = "pointerMoved",
    interactionUpdated = "interactionUpdated",
    lineOfSightUpdated = "lineOfSightUpdated",
    screenUpdated = "screenUpdated",
    drawingsUpdated = "drawingsUpdated",
    clientUpdated = "clientUpdated",
    mapLoaded = "mapLoaded",
    reload = "reload",
    messageCreated = "messageCreated",
    messageDeleted = "messageDeleted",
    createMessage = "createMessage"
}

export interface WSEvent {
    name: WSEventName;
    data: any;
}