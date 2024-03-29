export enum WSEventName {
    gameUpdated = "gameUpdated",
    mapUpdated = "mapUpdated",
    mapLoaded = "mapLoaded",
    mapFrameUpdated = "mapFrameUpdated",
    mapViewportUpdated = "mapViewportUpdated",
    mapFitScreen = "mapFitScreen",
    mapFocus = "mapFocus",
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
    reload = "reload",
    messageCreated = "messageCreated",
    messageDeleted = "messageDeleted",
    createMessage = "createMessage",
    measurementUpdated = "measurementUpdated",
    measurementsUpdated = "measurementsUpdated",
    trackedObjectCreated = "trackedObjectCreated",
    trackedObjectUpdated = "trackedObjectUpdated",
    trackedObjectDeleted = "trackedObjectDeleted",
    trackedObjectsUpdated = "trackedObjectsUpdated",
    updateModel = "updateModel",
    systemPaused = "systemPaused"
}

export interface WSEvent {
    name: WSEventName;
    model?: string;
    data: any;
}
