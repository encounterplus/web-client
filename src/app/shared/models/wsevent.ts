export enum WSEventName {
    gameUpdated = "gameUpdated",
    mapUpdated = "mapUpdated",
    creatureUpdated = "creatureUpdated",
    tileUpdated = "tileUpdated",
    tilesUpdated = "tilesUpdated",
    areaEffectUpdated = "areaEffectUpdated",
    areaEffectsUpdated = "areaEffectsUpdated",
    markerUpdated = "markerUpdated",
    markersUpdated = "markersUpdated",
    creatureMoved = "creatureMoved",
    tileMoved = "tileMoved",
    areaEffectMoved = "areaEffectMoved",
    markerMoved = "markerMoved",
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