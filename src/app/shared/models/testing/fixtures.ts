/**
 * Model fixtures for specs.
 *
 * Every `minimal*` sets the required fields and nothing else, so it stands for what the server
 * sends when it omits every optional field. They are written without casts on purpose: when a
 * field moves in or out of "required", the factory stops compiling, and that is the prompt to
 * check the call sites rather than a silent pass.
 *
 * The `full*` counterparts set every optional field, so a spec can assert both branches of a
 * default-reader against the same shape.
 *
 * Not a `.spec.ts`, so specs can import it; `tsconfig.app.json` reaches only what `main.ts`
 * imports, so none of this lands in the app bundle.
 */

import { AreaEffect, AreaEffectShape } from '../area-effect'
import { ApiData } from '../api-data'
import { Asset } from '../asset'
import { Aura } from '../aura'
import { ActiveCombatant, Combatant, Role } from '../combatant'
import { Component } from '../component'
import { Drawing, DrawingShape } from '../drawing'
import { Game, emptyGame } from '../game'
import { Initiative } from '../initiative'
import { Light } from '../light'
import { GridStyle, GridType, Map, MapLayer, WeatherType } from '../map'
import { Marker } from '../marker'
import { Measurement, MeasurementType } from '../measurement'
import { Message, MessageType } from '../message'
import { Screen, ScreenInteraction, SharedVision } from '../screen'
import { Sight } from '../sight'
import { Tile } from '../tile'
import { Size, Token, TokenStyle } from '../token'
import { TrackedObject, TrackedObjectType } from '../tracked-object'
import { Vision } from '../vision'
import { Wall, WallSide, WallType } from '../wall'

export function minimalToken(values: Partial<Token> = {}): Token {
    return {
        id: "token-1",
        x: 0,
        y: 0,
        scale: 1,
        width: 100,
        height: 100,
        rotation: 0,
        elevation: 0,
        hidden: false,
        ...values,
    }
}

export function fullToken(values: Partial<Token> = {}): Token {
    return minimalToken({
        name: "Goblin",
        label: "Goblin 1",
        role: Role.hostile,
        style: TokenStyle.topdown,
        reference: "monster:1",
        image: "goblin.png",
        asset: fullAsset(),
        vision: minimalVision(),
        auras: [minimalAura()],
        trackingId: 7,
        path: [0, 0, 10, 10],
        player: false,
        combatant: minimalCombatant(),
        ...values,
    })
}

export function minimalTile(values: Partial<Tile> = {}): Tile {
    return {
        id: "tile-1",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
        zIndex: 0,
        opacity: 1,
        scale: 1,
        hidden: false,
        ...values,
    }
}

export function fullTile(values: Partial<Tile> = {}): Tile {
    return minimalTile({
        layer: MapLayer.map,
        asset: fullAsset(),
        light: minimalLight(),
        ...values,
    })
}

export function minimalAsset(values: Partial<Asset> = {}): Asset {
    return {
        id: "asset-1",
        type: "image",
        ...values,
    }
}

export function fullAsset(values: Partial<Asset> = {}): Asset {
    return minimalAsset({
        name: "Artwork",
        resource: "artwork.png",
        parameters: { size: "M", scale: 1, offsetX: 0, offsetY: 0 },
        components: [minimalComponent()],
        ...values,
    })
}

/** A split-alpha video asset, the only transparent video format the client handles. */
export function videoAsset(values: Partial<Asset> = {}): Asset {
    return minimalAsset({
        type: "video",
        resource: "clip.mp4",
        ...values,
    })
}

export function minimalComponent(values: Partial<Component> = {}): Component {
    return {
        type: "animation.opacity",
        enabled: true,
        ...values,
    }
}

export function minimalVision(values: Partial<Vision> = {}): Vision {
    return {
        id: "vision-1",
        enabled: true,
        light: true,
        lightRadiusMin: 0,
        lightRadiusMax: 60,
        lightColor: "#ffffff",
        lightOpacity: 1,
        dark: false,
        darkRadiusMin: 0,
        darkRadiusMax: 0,
        ...values,
    }
}

export function minimalSight(values: Partial<Sight> = {}): Sight {
    return {
        key: "sight-1",
        x: 0,
        y: 0,
        polygon: [],
        ...values,
    }
}

export function minimalAura(values: Partial<Aura> = {}): Aura {
    return {
        id: "aura-1",
        enabled: true,
        color: "#ff0000",
        opacity: 0.5,
        radius: 10,
        ...values,
    }
}

export function minimalLight(values: Partial<Light> = {}): Light {
    return {
        id: "light-1",
        enabled: true,
        radiusMin: 0,
        radiusMax: 40,
        color: "#ffffff",
        opacity: 1,
        alwaysVisible: false,
        x: 0,
        y: 0,
        ...values,
    }
}

export function minimalAreaEffect(values: Partial<AreaEffect> = {}): AreaEffect {
    return {
        id: "area-effect-1",
        shape: AreaEffectShape.sphere,
        color: "#00ff00",
        x: 0,
        y: 0,
        zIndex: 0,
        opacity: 0.5,
        angle: 0,
        radius: 20,
        length: 0,
        width: 0,
        hidden: false,
        ...values,
    }
}

export function minimalMarker(values: Partial<Marker> = {}): Marker {
    return {
        id: "marker-1",
        x: 0,
        y: 0,
        color: "#0000ff",
        size: "M",
        shape: "circle",
        hidden: false,
        ...values,
    }
}

export function minimalMeasurement(values: Partial<Measurement> = {}): Measurement {
    return {
        id: "measurement-1",
        color: "#ffffff",
        hidden: false,
        data: [],
        ...values,
    }
}

export function fullMeasurement(values: Partial<Measurement> = {}): Measurement {
    return minimalMeasurement({
        type: MeasurementType.grid,
        data: [0, 0, 10, 10],
        ...values,
    })
}

export function minimalDrawing(values: Partial<Drawing> = {}): Drawing {
    return {
        id: "drawing-1",
        data: [],
        ...values,
    }
}

export function fullDrawing(values: Partial<Drawing> = {}): Drawing {
    return minimalDrawing({
        shape: DrawingShape.polygon,
        data: [0, 0, 10, 0, 10, 10],
        layer: MapLayer.dm,
        strokeWidth: 2,
        strokeColor: "#000000",
        fillColor: "#ffffff",
        opacity: 1,
        ...values,
    })
}

export function minimalWall(values: Partial<Wall> = {}): Wall {
    return {
        id: "wall-1",
        data: [],
        ...values,
    }
}

export function fullWall(values: Partial<Wall> = {}): Wall {
    return minimalWall({
        data: [0, 0, 10, 10],
        color: "#888888",
        type: WallType.normal,
        side: WallSide.both,
        ...values,
    })
}

export function minimalInitiative(values: Partial<Initiative> = {}): Initiative {
    return {
        id: "initiative-1",
        ...values,
    }
}

export function minimalCombatant(values: Partial<Combatant> = {}): Combatant {
    return {
        id: "combatant-1",
        rank: 0,
        ...values,
    }
}

export function fullCombatant(values: Partial<Combatant> = {}): Combatant {
    return minimalCombatant({
        label: "Goblin 1",
        name: "Goblin",
        role: Role.hostile,
        hidden: false,
        reference: "monster:1",
        data: {},
        attributes: {},
        initiative: [minimalInitiative()],
        bloodied: false,
        defeated: false,
        image: "goblin.png",
        tokenId: "token-1",
        entityId: "1",
        entityType: "Monster",
        player: false,
        ...values,
    })
}

export function minimalActiveCombatant(values: Partial<ActiveCombatant> = {}): ActiveCombatant {
    return {
        id: "combatant-1",
        turned: false,
        initiative: minimalInitiative(),
        combatant: minimalCombatant(),
        ...values,
    }
}

export function minimalGame(values: Partial<Game> = {}): Game {
    return { ...emptyGame(), ...values }
}

export function minimalScreen(values: Partial<Screen> = {}): Screen {
    return {
        overlayHandoutStyle: "",
        interaction: ScreenInteraction.none,
        sharedVision: SharedVision.never,
        tableTopMode: false,
        scrollLock: false,
        width: 1920,
        height: 1080,
        ...values,
    }
}

export function minimalMessage(values: Partial<Message> = {}): Message {
    return {
        id: "message-1",
        type: MessageType.chat,
        created: "2026-01-01T00:00:00Z",
        ...values,
    }
}

export function minimalTrackedObject(values: Partial<TrackedObject> = {}): TrackedObject {
    return Object.assign(new TrackedObject(), values)
}

/**
 * A map with every required field set and every optional one absent — including `drawings` and
 * `walls`, which are optional because they come from a different server implementation.
 */
export function minimalMap(values: Partial<Map> = {}): Map {
    return {
        id: "map-1",
        name: "Map",
        slug: "map",
        gridVisible: true,
        gridColor: "#000000",
        gridSize: 50,
        gridOffsetX: 0,
        gridOffsetY: 0,
        gridScale: 5,
        gridUnits: "ft",
        gridType: GridType.square,
        gridStyle: GridStyle.solid,
        gridOpacity: 1,
        scale: 1,
        lineOfSight: false,
        losDaylight: 1,
        losVisionLimit: 0,
        fogOfWar: false,
        fogExploration: false,
        weatherIntensity: 0,
        x: 0,
        y: 0,
        zoom: 1,
        width: 1000,
        height: 1000,
        tiles: [],
        tokens: [],
        areaEffects: [],
        markers: [],
        lights: [],
        measurements: [],
        ...values,
    }
}

export function fullMap(values: Partial<Map> = {}): Map {
    return minimalMap({
        image: "map.png",
        video: "map.mp4",
        fog: "fog.png",
        weatherType: WeatherType.rain,
        weatherIntensity: 0.5,
        tiles: [fullTile()],
        tokens: [fullToken()],
        areaEffects: [minimalAreaEffect()],
        markers: [minimalMarker()],
        drawings: [fullDrawing()],
        walls: [fullWall()],
        lights: [minimalLight()],
        measurements: [fullMeasurement()],
        ...values,
    })
}

export function minimalApiData(values: Partial<ApiData> = {}): ApiData {
    return {
        version: "0.9.17",
        build: 1,
        map: minimalMap(),
        game: minimalGame(),
        screen: minimalScreen(),
        messages: [],
        trackedObjects: [],
        paused: false,
        ...values,
    }
}

/** Re-exported so specs can reach the grid sizes without a second import. */
export { Size, TrackedObjectType }
