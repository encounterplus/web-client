/**
 * Smoke tests for the websocket reducer.
 *
 * `handleEvent` reads its payloads through `as Model` casts, so the compiler checks nothing about
 * what actually arrives. These specs feed each event family a model with only its required fields
 * set — what the server sends once every optional field is omitted — and assert the reducer both
 * survives it and puts it where the rest of the app looks for it.
 */

import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AppState, RunMode } from './shared/models/app-state';
import { DataService } from './shared/services/data.service';
import { WSEvent, WSEventName } from './shared/models/wsevent';
import { MapLayer } from './shared/models/map';
import { ControlState } from './core/map/views/token-view';
import { mapComponentStub, modelViewStub, tileViewStub, tokenViewStub } from './core/map/testing/map-component-stub';
import {
  minimalAreaEffect,
  minimalCombatant,
  minimalDrawing,
  minimalLight,
  minimalMap,
  minimalMarker,
  minimalMeasurement,
  minimalMessage,
  minimalScreen,
  minimalTile,
  minimalToken,
  minimalTrackedObject,
  minimalVision,
  minimalSight,
} from './shared/models/testing/fixtures';

function dataServiceStub() {
  return {
    state: new AppState(),
    remoteHost: "localhost",
    protocol: "http:",
    attemptNr: 0,
    baseURL: "http://localhost",
    events$: new Subject<WSEvent>(),
    connectionStatus$: new Subject<boolean>(),
    showEntityEmitter: new EventEmitter<string>(),
    connect: jasmine.createSpy('connect'),
    send: jasmine.createSpy('send'),
    getData: jasmine.createSpy('getData').and.returnValue(EMPTY)
  };
}

describe('AppComponent websocket events', () => {
  let app: AppComponent;
  let map: ReturnType<typeof mapComponentStub>;
  let container: ReturnType<typeof mapComponentStub>['mapContainer'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [{ provide: DataService, useValue: dataServiceStub() }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    app = TestBed.createComponent(AppComponent).componentInstance;
    map = mapComponentStub();
    container = map.mapContainer;
    // the real one needs a WebGL context; the reducer only ever calls methods on it
    app.mapComponent = map as any;
    app.state.map = minimalMap();
  });

  function send(name: WSEventName, data: any) {
    app.handleEvent({ name, data });
  }

  describe('systemPaused', () => {

    it('mirrors the flag into the state and the signal', () => {
      send(WSEventName.systemPaused, true);
      expect(app.state.paused).toBe(true);
      expect(app.paused()).toBe(true);
    });
  });

  describe('gameUpdated', () => {

    it('applies the fields the event carries', () => {
      send(WSEventName.gameUpdated, { turn: 2, round: 3, started: true, combatantId: "a", initiativeId: "i" });
      expect(app.state.game.turn).toBe(2);
      expect(app.state.game.round).toBe(3);
      expect(app.state.game.started).toBe(true);
      expect(app.state.game.combatantId).toBe("a");
      expect(app.state.game.initiativeId).toBe("i");
    });

    it('redraws the map when the event carries combatants', () => {
      send(WSEventName.gameUpdated, { combatants: [minimalCombatant()] });
      expect(app.state.game.combatants.length).toBe(1);
      expect(container.update).toHaveBeenCalled();
      expect(container.draw).toHaveBeenCalled();
    });

    it('keeps the combatants it has when the event leaves them out', () => {
      app.state.game.combatants = [minimalCombatant({ id: "a" })];
      send(WSEventName.gameUpdated, { turn: 1 });
      expect(app.state.game.combatants.map(combatant => combatant.id)).toEqual(["a"]);
      expect(container.update).not.toHaveBeenCalled();
    });

    it('resets the paths when the turn moved on without a combatant', () => {
      send(WSEventName.gameUpdated, { turn: 5 });
      expect(container.resetPaths).toHaveBeenCalled();
    });

    it('leaves the paths alone when the event is about a combatant', () => {
      send(WSEventName.gameUpdated, { turn: 5, combatant: minimalCombatant() });
      expect(container.resetPaths).not.toHaveBeenCalled();
    });

    it('survives a game with no combatants at all', () => {
      expect(() => send(WSEventName.gameUpdated, {})).not.toThrow();
    });
  });

  describe('combatantUpdated', () => {

    it('merges into the combatant it already has', () => {
      app.state.game.combatants = [minimalCombatant({ id: "a", name: "Goblin" })];
      send(WSEventName.combatantUpdated, { id: "a", bloodied: true });
      expect(app.state.game.combatants[0].name).toBe("Goblin");
      expect(app.state.game.combatants[0].bloodied).toBe(true);
    });

    it('ignores an unknown combatant', () => {
      expect(() => send(WSEventName.combatantUpdated, { id: "z", bloodied: true })).not.toThrow();
      expect(app.state.game.combatants).toEqual([]);
    });
  });

  describe('mapUpdated', () => {

    it('applies the event onto the map and redraws', () => {
      send(WSEventName.mapUpdated, minimalMap({ id: "map-1", name: "Cave", gridSize: 70 }));
      expect(app.state.map!.name).toBe("Cave");
      expect(app.state.map!.gridSize).toBe(70);
      expect(container.update).toHaveBeenCalled();
      expect(container.draw).toHaveBeenCalled();
    });

    it('clears the weather when the event leaves it out', () => {
      app.state.map = minimalMap({ weatherType: undefined });
      send(WSEventName.mapUpdated, minimalMap());
      expect(app.state.map!.weatherType).toBeUndefined();
    });
  });

  describe('mapFrameUpdated', () => {

    it('moves the map frame', () => {
      send(WSEventName.mapFrameUpdated, { x: 10, y: 20, zoom: 2 });
      expect(app.state.map!.x).toBe(10);
      expect(app.state.map!.y).toBe(20);
      expect(app.state.map!.zoom).toBe(2);
    });

    // the guard is `if (event.data.x && event.data.y)`, so a frame moved back to the origin is
    // read as "no position sent" and the old one stays
    it('does not move the frame to zero', () => {
      app.state.map = minimalMap({ x: 10, y: 20 });
      send(WSEventName.mapFrameUpdated, { x: 0, y: 0 });
      expect(app.state.map!.x).toBe(10);
      expect(app.state.map!.y).toBe(20);
    });

    it('does nothing when there is no map', () => {
      app.state.map = undefined;
      expect(() => send(WSEventName.mapFrameUpdated, { x: 1, y: 1 })).not.toThrow();
    });
  });

  describe('tokenUpdated', () => {

    it('stores a token that carries only its required fields', () => {
      send(WSEventName.tokenUpdated, minimalToken({ id: "t1" }));
      expect(app.state.map!.tokens.map(token => token.id)).toEqual(["t1"]);
      expect(container.updateTokens).toHaveBeenCalled();
      expect(container.drawTokens).toHaveBeenCalled();
    });

    it('replaces the token it already has rather than adding a second', () => {
      app.state.map = minimalMap({ tokens: [minimalToken({ id: "t1", x: 0 })] });
      send(WSEventName.tokenUpdated, minimalToken({ id: "t1", x: 99 }));
      expect(app.state.map!.tokens.length).toBe(1);
      expect(app.state.map!.tokens[0].x).toBe(99);
    });

    it('redraws just the one view when the token is already on screen', () => {
      const view = tokenViewStub();
      container.tokenViewById.and.returnValue(view as any);
      send(WSEventName.tokenUpdated, minimalToken({ id: "t1" }));
      expect(view.draw).toHaveBeenCalled();
      expect(container.updateTokens).not.toHaveBeenCalled();
    });

    it('leaves the light and vision layers alone for a token that cannot see', () => {
      send(WSEventName.tokenUpdated, minimalToken());
      expect(container.visionLayer.draw).not.toHaveBeenCalled();
    });

    it('redraws the light and vision layers for a token that can', () => {
      send(WSEventName.tokenUpdated, minimalToken({ vision: minimalVision() }));
      expect(container.visionLayer.draw).toHaveBeenCalled();
      expect(container.lightsLayer.draw).toHaveBeenCalled();
    });

    it('does nothing when there is no map', () => {
      app.state.map = undefined;
      expect(() => send(WSEventName.tokenUpdated, minimalToken())).not.toThrow();
    });
  });

  describe('tokenMoved', () => {

    it('moves the view it finds', () => {
      const view = tokenViewStub(minimalToken({ id: "t1" }));
      container.tokenViewById.and.returnValue(view as any);
      send(WSEventName.tokenMoved, { id: "t1", x: 40, y: 50, state: ControlState.control });
      expect(view.token.x).toBe(40);
      expect(view.token.y).toBe(50);
      expect(view.update).toHaveBeenCalled();
    });

    it('survives a move for a token with no view and no polygon', () => {
      expect(() => send(WSEventName.tokenMoved, { id: "t1", x: 1, y: 1 })).not.toThrow();
    });

    it('moves the token in the state when the event carries a polygon', () => {
      app.state.map = minimalMap({ tokens: [minimalToken({ id: "t1" })] });
      send(WSEventName.tokenMoved, { id: "t1", x: 40, y: 50, polygon: [1, 2] });
      expect(app.state.map!.tokens[0].x).toBe(40);
      expect(container.visionLayer.draw).toHaveBeenCalled();
    });

    it('survives a polygon for a token whose vision the server left out', () => {
      app.state.map = minimalMap({ tokens: [minimalToken({ id: "t1" })] });
      expect(() => send(WSEventName.tokenMoved, { id: "t1", x: 1, y: 1, polygon: [1, 2] })).not.toThrow();
    });
  });

  describe('tileUpdated', () => {

    it('stores a tile that carries only its required fields', () => {
      send(WSEventName.tileUpdated, minimalTile({ id: "tile-1" }));
      expect(app.state.map!.tiles.map(tile => tile.id)).toEqual(["tile-1"]);
    });

    // the view resolves an absent layer to `object` through `tileLayer`, so the reducer has to
    // read the event the same way or it never matches and redraws every tile
    it('redraws just the one view when a tile arrives without a layer', () => {
      const view = tileViewStub(MapLayer.object);
      container.tileViewById.and.returnValue(view as any);
      send(WSEventName.tileUpdated, minimalTile({ id: "tile-1" }));
      expect(view.draw).toHaveBeenCalled();
      expect(container.updateTiles).not.toHaveBeenCalled();
    });

    it('redraws every tile when the tile moved to another layer', () => {
      const view = tileViewStub(MapLayer.object);
      container.tileViewById.and.returnValue(view as any);
      send(WSEventName.tileUpdated, minimalTile({ id: "tile-1", layer: MapLayer.dm }));
      expect(container.updateTiles).toHaveBeenCalled();
      expect(container.drawTiles).toHaveBeenCalled();
    });

    it('redraws the light layers for a tile that carries a light', () => {
      send(WSEventName.tileUpdated, minimalTile({ light: minimalLight() }));
      expect(container.lightsLayer.update).toHaveBeenCalled();
    });

    it('does nothing when there is no map', () => {
      app.state.map = undefined;
      expect(() => send(WSEventName.tileUpdated, minimalTile())).not.toThrow();
    });
  });

  describe('the single-model events', () => {

    it('stores a light and redraws the light layers', () => {
      send(WSEventName.lightUpdated, minimalLight({ id: "l1" }));
      expect(app.state.map!.lights.map(light => light.id)).toEqual(["l1"]);
      expect(container.lightsLayer.update).toHaveBeenCalled();
      expect(container.visionLayer.draw).toHaveBeenCalled();
    });

    it('stores a marker and redraws its view', () => {
      const view = modelViewStub();
      container.markerViewById.and.returnValue(view as any);
      send(WSEventName.markerUpdated, minimalMarker({ id: "m1" }));
      expect(app.state.map!.markers.map(marker => marker.id)).toEqual(["m1"]);
      expect(view.draw).toHaveBeenCalled();
    });

    it('stores an area effect', () => {
      send(WSEventName.areaEffectUpdated, minimalAreaEffect({ id: "a1" }));
      expect(app.state.map!.areaEffects.map(effect => effect.id)).toEqual(["a1"]);
    });

    it('stores a measurement that carries no type', () => {
      send(WSEventName.measurementUpdated, minimalMeasurement({ id: "me1" }));
      expect(app.state.map!.measurements.map(measurement => measurement.id)).toEqual(["me1"]);
    });

    it('all do nothing when there is no map', () => {
      app.state.map = undefined;
      expect(() => {
        send(WSEventName.lightUpdated, minimalLight());
        send(WSEventName.markerUpdated, minimalMarker());
        send(WSEventName.areaEffectUpdated, minimalAreaEffect());
        send(WSEventName.measurementUpdated, minimalMeasurement());
      }).not.toThrow();
    });
  });

  describe('the whole-collection events', () => {

    it('replaces the tokens and redraws', () => {
      send(WSEventName.tokensUpdated, [minimalToken({ id: "t1" })]);
      expect(app.state.map!.tokens.map(token => token.id)).toEqual(["t1"]);
      expect(container.updateTokens).toHaveBeenCalled();
    });

    it('replaces the tiles and redraws', () => {
      send(WSEventName.tilesUpdated, [minimalTile({ id: "tile-1" })]);
      expect(app.state.map!.tiles.map(tile => tile.id)).toEqual(["tile-1"]);
      expect(container.updateTiles).toHaveBeenCalled();
    });

    it('replaces the lights, markers, area effects and measurements', () => {
      send(WSEventName.lightsUpdated, [minimalLight({ id: "l1" })]);
      send(WSEventName.markersUpdated, [minimalMarker({ id: "m1" })]);
      send(WSEventName.areaEffectsUpdated, [minimalAreaEffect({ id: "a1" })]);
      send(WSEventName.measurementsUpdated, [minimalMeasurement({ id: "me1" })]);
      expect(app.state.map!.lights.length).toBe(1);
      expect(app.state.map!.markers.length).toBe(1);
      expect(app.state.map!.areaEffects.length).toBe(1);
      expect(app.state.map!.measurements.length).toBe(1);
    });

    // drawings and walls are optional on the map because they come from a different server
    // implementation, so the map they land on may not have the field at all
    it('sets the drawings on a map that had none', () => {
      expect(app.state.map!.drawings).toBeUndefined();
      send(WSEventName.drawingsUpdated, [minimalDrawing({ id: "d1" })]);
      expect(app.state.map!.drawings!.map(drawing => drawing.id)).toEqual(["d1"]);
      expect(container.drawingsLayer.update).toHaveBeenCalled();
      expect(container.drawingsLayer.draw).toHaveBeenCalled();
    });

    it('all do nothing when there is no map', () => {
      app.state.map = undefined;
      expect(() => {
        send(WSEventName.tokensUpdated, []);
        send(WSEventName.tilesUpdated, []);
        send(WSEventName.lightsUpdated, []);
        send(WSEventName.markersUpdated, []);
        send(WSEventName.areaEffectsUpdated, []);
        send(WSEventName.measurementsUpdated, []);
        send(WSEventName.drawingsUpdated, []);
      }).not.toThrow();
    });
  });

  describe('lineOfSightUpdated', () => {

    it('attaches a sight to the token that owns it', () => {
      const vision = minimalVision({ id: "v1", sight: minimalSight({ key: "vision-v1" }) });
      app.state.map = minimalMap({ tokens: [minimalToken({ vision })] });
      send(WSEventName.lineOfSightUpdated, [minimalSight({ key: "vision-v1", polygon: [1, 2, 3] })]);
      expect(app.state.map!.tokens[0].vision!.sight!.polygon).toEqual([1, 2, 3]);
    });

    it('attaches a sight to the light that owns it', () => {
      app.state.map = minimalMap({ lights: [minimalLight({ id: "l1" })] });
      send(WSEventName.lineOfSightUpdated, [minimalSight({ key: "light-l1", polygon: [4, 5] })]);
      expect(app.state.map!.lights[0].sight!.polygon).toEqual([4, 5]);
    });

    it('skips tokens and tiles whose vision or light the server left out', () => {
      app.state.map = minimalMap({ tokens: [minimalToken()], tiles: [minimalTile()] });
      expect(() => send(WSEventName.lineOfSightUpdated, [minimalSight({ key: "vision-v1" }), minimalSight({ key: "light-l1" })])).not.toThrow();
    });
  });

  describe('screenUpdated', () => {

    it('replaces the screen and redraws the light layers', () => {
      send(WSEventName.screenUpdated, minimalScreen({ width: 800 }));
      expect(app.state.screen.width).toBe(800);
      expect(app.screen().width).toBe(800);
      expect(container.visionLayer.draw).toHaveBeenCalled();
    });

    it('fits the screen when tabletop mode turns on in tv mode', () => {
      app.state.runMode = RunMode.tv;
      send(WSEventName.screenUpdated, minimalScreen({ tableTopMode: true }));
      expect(map.viewport.setZoom).toHaveBeenCalled();
      expect(map.notifyViewportUpdate).toHaveBeenCalled();
    });
  });

  describe('the events that do not touch the map', () => {

    it('appends a message and counts it as unread', () => {
      send(WSEventName.messageCreated, minimalMessage({ id: "msg-1" }));
      expect(app.state.messages.map(message => message.id)).toEqual(["msg-1"]);
      expect(app.unreadMessages()).toBe(1);
    });

    it('stores the interaction mode', () => {
      send(WSEventName.interactionUpdated, "all");
      expect(app.state.screen.interaction).toBe("all" as any);
      expect(container.updateInteraction).toHaveBeenCalled();
    });

    it('hands the fog straight to the vision layer', () => {
      send(WSEventName.fogUpdated, { image: "data:image/png;base64,AAA" });
      expect(container.visionLayer.updateFogFromData).toHaveBeenCalledWith("data:image/png;base64,AAA");
    });

    it('re-reads the api on mapLoaded', () => {
      const dataService = TestBed.inject(DataService) as any;
      send(WSEventName.mapLoaded, {});
      expect(dataService.getData).toHaveBeenCalled();
    });
  });

  describe('the tracked object events', () => {

    it('adds a tracked object and redraws the container', () => {
      send(WSEventName.trackedObjectCreated, { id: 1, x: 10, y: 20 });
      expect(app.state.trackedObjects.length).toBe(1);
      expect(map.trackedObjectsContainer.update).toHaveBeenCalled();
    });

    it('replaces rather than duplicates on create', () => {
      send(WSEventName.trackedObjectCreated, { id: 1, x: 10 });
      send(WSEventName.trackedObjectCreated, { id: 1, x: 30 });
      expect(app.state.trackedObjects.length).toBe(1);
      expect(app.state.trackedObjects[0].x).toBe(30);
    });

    it('removes a tracked object', () => {
      app.state.trackedObjects = [minimalTrackedObject({ id: 1 })];
      send(WSEventName.trackedObjectDeleted, { id: 1 });
      expect(app.state.trackedObjects).toEqual([]);
    });

    it('survives an update for an object with no position', () => {
      app.state.trackedObjects = [minimalTrackedObject({ id: 1 })];
      expect(() => send(WSEventName.trackedObjectUpdated, { id: 1 })).not.toThrow();
    });

    it('replaces the whole collection', () => {
      send(WSEventName.trackedObjectsUpdated, [minimalTrackedObject({ id: 1 })]);
      expect(app.state.trackedObjects.length).toBe(1);
      expect(map.trackedObjectsContainer.draw).toHaveBeenCalled();
    });
  });

  describe('an unknown event', () => {

    it('is ignored', () => {
      expect(() => app.handleEvent({ name: "nonsense" as WSEventName, data: {} })).not.toThrow();
    });
  });
});
