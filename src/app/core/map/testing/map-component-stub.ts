/**
 * A stand-in for `MapComponent` and the Pixi containers under it.
 *
 * `AppComponent.handleEvent` reaches through `this.mapComponent.mapContainer` on nearly every
 * event, so a spec that drives the reducer needs the whole shape. The real containers need a
 * WebGL context, which the spec runner has no business setting up, so every method here is a
 * spy: the spec asserts which layers a given event redrew rather than what the pixels became.
 *
 * View lookups return null by default, the way an empty map behaves. A spec that wants the
 * "view already on screen" branch overrides one with `.and.returnValue(tokenViewStub())`.
 */

import { minimalToken } from 'src/app/shared/models/testing/fixtures'
import { Token } from 'src/app/shared/models/token'
import { MapLayer } from 'src/app/shared/models/map'

export function layerStub() {
    return {
        update: jasmine.createSpy('update'),
        draw: jasmine.createSpy('draw'),
        updateFogFromData: jasmine.createSpy('updateFogFromData'),
        drawFocus: jasmine.createSpy('drawFocus'),
        drawPointer: jasmine.createSpy('drawPointer'),
    }
}

export function tokenViewStub(token: Token = minimalToken()) {
    return {
        token,
        controlled: false,
        dragging: false,
        blocked: false,
        draw: jasmine.createSpy('draw'),
        update: jasmine.createSpy('update'),
        updateTint: jasmine.createSpy('updateTint'),
        drawPath: jasmine.createSpy('drawPath'),
        updateElevation: jasmine.createSpy('updateElevation'),
    }
}

export function tileViewStub(mapLayer: MapLayer = MapLayer.object) {
    return {
        mapLayer,
        tile: null as any,
        draw: jasmine.createSpy('draw'),
    }
}

/** A view that only carries its model and redraws — markers, area effects and measurements. */
export function modelViewStub() {
    return {
        marker: null as any,
        areaEffect: null as any,
        measurement: null as any,
        trackedObject: null as any,
        draw: jasmine.createSpy('draw'),
        update: jasmine.createSpy('update'),
    }
}

export function mapContainerStub() {
    return {
        w: 1000,
        h: 1000,
        grid: { adjustedSize: { width: 50, height: 50 } },

        visionLayer: layerStub(),
        lightsLayer: layerStub(),
        effectsLayer: layerStub(),
        drawingsLayer: layerStub(),
        markersLayer: layerStub(),
        areaEffectsLayer: layerStub(),
        measurementsLayer: layerStub(),

        update: jasmine.createSpy('update'),
        draw: jasmine.createSpy('draw'),
        updateInteraction: jasmine.createSpy('updateInteraction'),
        updateTurned: jasmine.createSpy('updateTurned'),
        resetPaths: jasmine.createSpy('resetPaths'),
        updateTokens: jasmine.createSpy('updateTokens'),
        drawTokens: jasmine.createSpy('drawTokens'),
        updateTiles: jasmine.createSpy('updateTiles'),
        drawTiles: jasmine.createSpy('drawTiles'),

        tokenViewById: jasmine.createSpy('tokenViewById').and.returnValue(null),
        tokenViewByTrackingId: jasmine.createSpy('tokenViewByTrackingId').and.returnValue(null),
        tileViewById: jasmine.createSpy('tileViewById').and.returnValue(null),
        markerViewById: jasmine.createSpy('markerViewById').and.returnValue(null),
        areaEffectViewById: jasmine.createSpy('areaEffectViewById').and.returnValue(null),
        measurementViewById: jasmine.createSpy('measurementViewById').and.returnValue(null),
    }
}

export function mapComponentStub() {
    return {
        mapContainer: mapContainerStub(),
        trackedObjectsContainer: {
            update: jasmine.createSpy('update'),
            draw: jasmine.createSpy('draw'),
            trackedObjectViewById: jasmine.createSpy('trackedObjectViewById').and.returnValue(null),
        },
        viewport: {
            screenWidth: 1920,
            screenHeight: 1080,
            moving: false,
            zooming: false,
            scale: { x: 1 },
            center: { x: 0, y: 0 },
            setZoom: jasmine.createSpy('setZoom'),
            moveCenter: jasmine.createSpy('moveCenter'),
            fitWorld: jasmine.createSpy('fitWorld'),
            animate: jasmine.createSpy('animate'),
        },
        notifyViewportUpdate: jasmine.createSpy('notifyViewportUpdate'),
        convertScreenToMap: jasmine.createSpy('convertScreenToMap').and.returnValue({ x: 0, y: 0 }),
    }
}
