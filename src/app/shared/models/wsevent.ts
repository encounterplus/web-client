export enum WSEventName {
    gameUpdated = "gameUpdated",
    mapUpdated = "mapUpdated",
    mapLoaded = "mapLoaded",
    mapFrameUpdated = "mapFrameUpdated",
    mapViewportUpdated = "mapViewportUpdated",
    mapFitScreen = "mapFitScreen",
    mapFocus = "mapFocus",
    combatantUpdated = "combatantUpdated",
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
    interactionUpdated = "interactionUpdated",
    lineOfSightUpdated = "lineOfSightUpdated",
    screenUpdated = "screenUpdated",
    drawingsUpdated = "drawingsUpdated",
    clientUpdated = "clientUpdated",
    reload = "reload",
    messageCreated = "messageCreated",
    createMessage = "createMessage",
    measurementUpdated = "measurementUpdated",
    measurementsUpdated = "measurementsUpdated",
    trackedObjectCreated = "trackedObjectCreated",
    trackedObjectUpdated = "trackedObjectUpdated",
    trackedObjectDeleted = "trackedObjectDeleted",
    trackedObjectsUpdated = "trackedObjectsUpdated",
    // a player may send only rotation and path; anything else is refused
    updateToken = "updateToken",
    systemPaused = "systemPaused",
    resourcesUpdated = "resourcesUpdated",
    // signing in on the socket: authenticate { accessToken? } → authenticated { role, … }
    authenticate = "authenticate",
    authenticated = "authenticated",
    // who a signed-in player is now, unasked — as `authenticated` — after their characters changed
    sessionUpdated = "sessionUpdated",
    requestFailed = "requestFailed"
}

export interface WSEvent {
    name: WSEventName;
    data: any;
    /** Sent with a request; the answer carries it back as `responseId`. */
    requestId?: string;
    responseId?: string;
}
