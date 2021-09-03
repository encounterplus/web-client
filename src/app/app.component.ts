import { Component, OnInit, ViewChild, AfterViewInit, ɵɵtrustConstantResourceUrl, ComponentFactoryResolver, NgZone } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService} from './shared/services/data.service';
import { environment } from 'src/environments/environment';
import { AppState, RunMode, ViewMode } from './shared/models/app-state';
import { WSEventName, WSEvent } from './shared/models/wsevent';
import { ControlState, TokenView } from './core/map/views/token-view';
import { AreaEffect } from './shared/models/area-effect';
import { Tile } from './shared/models/tile';
import { ToolbarComponent, Tool, Panel } from './core/toolbar/toolbar.component';
import { ToastListComponent } from './core/toast-list/toast-list.component';
import { ToastService } from './shared/services/toast.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsModalComponent } from './core/settings-modal/settings-modal.component';
import { Loader } from './core/map/models/loader';
import { AboutModalComponent } from './core/about-modal/about-modal.component';
import { Marker } from './shared/models/marker';
import { MessageListComponent } from './core/message-list/message-list.component';
import { Token } from './shared/models/token';
import { Light } from './shared/models/light';
import { Sight } from './shared/models/sight';
import { CacheManager } from './shared/utils';
import { SharedVision } from './shared/models/screen';
import { TrackedObject } from './shared/models/tracked-object';
import { Measurement } from './shared/models/measurement';
import { Point } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { ZoombarComponent } from './core/zoombar/zoombar.component';

interface WebAppInterface {
  showText(text: string): any;
  wsConnected(remoteHost: string): any;
  exit(): any;
}

declare var appInterface: WebAppInterface;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'external-screen';

  env = environment;

  state: AppState;

  destroy$: Subject<boolean> = new Subject<boolean>();

  @ViewChild(MapComponent)
  public mapComponent: MapComponent;

  @ViewChild(InitiativeListComponent)
  public initiativeListComponent: InitiativeListComponent;

  @ViewChild(MessageListComponent)
  public messageListComponent: MessageListComponent;

  @ViewChild(ToolbarComponent)
  public toolbarComponent: ToolbarComponent;

  @ViewChild(ZoombarComponent)
  public zoombarComponent: ZoombarComponent;

  @ViewChild(ToastListComponent)
  public toastListComponent: ToastListComponent;

  constructor(private zone: NgZone, private dataService: DataService, private toastService: ToastService, private modalService: NgbModal) {
    this.state = new AppState();

    window['state'] = this.state
    window['componentRef'] = {
      zone: this.zone,
      componentFn: (value) => this.handleExternalEvent(value),
      component: this
    };
  }

  handleExternalEvent(data) {
    // console.log(JSON.stringify(data))

    // send to server
    this.dataService.send(data)

    // handle event locally
    if (data.name == WSEventName.trackedObjectCreated ||
      data.name == WSEventName.trackedObjectUpdated ||
      data.name == WSEventName.trackedObjectDeleted ||
      data.name == WSEventName.trackedObjectsUpdated) {
      this.handleEvent(data)
    }
  }

  messages: Boolean = false;
  movingTokenView?: TokenView = null

  toolbarAction(type: string) {
    console.log(type);
    switch (type) {
      case "showSettings":
        // pause viewport events to prevent interactions with map
        if (this.mapComponent) {
          this.mapComponent.viewport.pause = true
        }

        let modal = this.modalService.open(SettingsModalComponent)
        modal.componentInstance.state = this.state
        modal.result.then(result => {
          console.debug(`Settings component closed with: ${result}`);

          if (this.mapComponent) {
            // update maxFPS
            this.mapComponent.app.ticker.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60;
            this.mapComponent.mapContainer.visionLayer.update()
            this.mapComponent.mapContainer.lightsLayer.update()
            this.mapComponent.mapContainer.visionLayer.draw()
            this.mapComponent.mapContainer.lightsLayer.draw()
            this.mapComponent.mapContainer.updateInteraction();

            // unpause viewport events                    
            this.mapComponent.viewport.pause = false
          }

          if (typeof appInterface !== "undefined") {
            appInterface.showText("Settings changed")
          }

        }, reason => {
          console.debug(`Setting component dismissed ${reason}`)
          // unpause viewport events
          if (this.mapComponent) {
            this.mapComponent.viewport.pause = false
          }
        });
        break;
      case "showAbout":
        this.modalService.open(AboutModalComponent).result.then(result => {
          console.debug(`About component closed with: ${result}`);
        }, reason => {
          console.debug(`About component dismissed ${reason}`)
        });
        break;
      case "reload":
        window.location.reload()
        break
      case "exit":
        if (typeof appInterface !== "undefined") {
          appInterface.exit()
        } else {
          window.close()
        }
        break
    }
  }

  zoombarAction(type: string) {
    console.log(type);
    switch (type) {
      
      case "zoomIn":
        this.mapComponent.viewport.animate({ scale: this.mapComponent.viewport.scale.x + 0.1, time: 100 })
        break;

      case "zoomOut":
        this.mapComponent.viewport.animate({ scale: this.mapComponent.viewport.scale.x - 0.1, time: 100 })
        break;

      case "focusToken":
        let view = this.mapComponent.mapContainer.tokenViewById(localStorage.getItem("userTokenId"))
        if (view) {
          this.mapComponent.viewport.animate({ position: view.position, scale: 1.0, time: 2000, ease: "easeInOutSine", removeOnInterrupt: true })
        }
        break;
    }
  }

  activeToolAction(tool: Tool) {
    if (this.mapComponent) {
      this.mapComponent.mapContainer.activeTool = tool;
    }
  }

  activePanelAction(panel: Panel) {
    this.messages = panel == Panel.messages;
    if (panel) {
      let lastHost = localStorage.getItem("lastSuccessfullHost");
      localStorage.setItem("readMessages", JSON.stringify({ "lastHost": lastHost, seenCount: this.state.messages.length }));
      this.state.readCount = this.state.messages.length;
    }
  }

  // main websocket event handler
  handleEvent(event: WSEvent) {
    console.debug(`Event received: ${event.name}`)
    // console.log(JSON.stringify(event));

    switch (event.name) {

      case WSEventName.gameUpdated: {
        this.state.game.turn = event.data.turn;
        this.state.game.round = event.data.round;
        this.state.game.started = event.data.started;
        this.state.game.paused = event.data.paused;

        if (event.data.creatures) {
          this.state.game.creatures = event.data.creatures;
          this.mapComponent.mapContainer.update(this.state);
          this.mapComponent.mapContainer.draw();
        }
        if (this.initiativeListComponent) {
          this.initiativeListComponent.scrollToTurned();
        }

        if (this.mapComponent) {
          this.mapComponent.mapContainer.updateInteraction();
          this.mapComponent.mapContainer.updateTurned(this.state.turned);
        }

        // this could be more optimised
        if (this.state.screen.sharedVision != SharedVision.always) {
          this.mapComponent.mapContainer.visionLayer.draw()
          this.mapComponent.mapContainer.lightsLayer.draw()
        }

        break;
      }

      case WSEventName.mapUpdated: {

        let map = this.state.map;

        if (map) {
          Object.assign(map, event.data);

          // force weather type asssignment
          map.weatherType = event.data.weatherType
        }

        this.mapComponent.mapContainer.update(this.state);
        this.mapComponent.mapContainer.draw();
        break;
      }

      case WSEventName.mapFrameUpdated: {

        if (event.data.x && event.data.y) {
          this.state.map.x = event.data.x
          this.state.map.y = event.data.y
        }

        if (event.data.zoom) {
          this.state.map.zoom = event.data.zoom
        }

        // skip this in normal mode
        if (this.state.runMode == RunMode.normal) {
          return
        }

        // console.debug(event.data)

        // let scale = this.mapComponent.viewport.screenHeight / event.data.height
        // console.log(scale)

        if (event.data.zoom && !this.state.screen.tableTopMode && !this.state.screen.scrollLock && this.mapComponent.viewport.zooming == false) {
          // console.log(event.data.zoom)

          // set zoom
          this.mapComponent.viewport.setZoom(event.data.zoom)

          // fix center
          const x = ((this.state.map.x ) + (this.mapComponent.mapContainer.w / 2))
          const y = ((this.state.map.y ) + (this.mapComponent.mapContainer.h / 2))
          this.mapComponent.viewport.moveCenter(x, y)
          return
        }

        if (event.data.x && event.data.y && !this.state.screen.scrollLock && this.mapComponent.viewport.moving == false) {

          if (this.state.screen.tableTopMode) {
            // set center
            const x = ((event.data.x ) + (this.mapComponent.mapContainer.w / 2))
            const y = ((event.data.y ) + (this.mapComponent.mapContainer.h / 2))
            this.mapComponent.viewport.moveCenter(x, y)
          } else {
            // set center
            const x = ((event.data.x ) + (this.mapComponent.mapContainer.w / 2))
            const y = ((event.data.y ) + (this.mapComponent.mapContainer.h / 2))
            this.mapComponent.viewport.moveCenter(x, y)
          }

        }
        break;
      }

      case WSEventName.mapFitScreen: {
        if (this.state.screen.tableTopMode) {
          const mapGridSize = this.mapComponent.mapContainer.grid.adjustedSize.width
          const screenGridSize = this.mapComponent.viewport.screenWidth / this.state.screen.width
          let scale = screenGridSize / mapGridSize

          // set zoom
          this.mapComponent.viewport.setZoom(scale)

          // set center
          const x = ((this.state.map.x / this.state.map.zoom) + (this.mapComponent.mapContainer.w / 2))
          const y = ((this.state.map.y / this.state.map.zoom) + (this.mapComponent.mapContainer.h / 2))
          this.mapComponent.viewport.moveCenter(x, y)
        } else {
          this.mapComponent.viewport.fitWorld(true)
          this.mapComponent.viewport.moveCenter(this.mapComponent.mapContainer.w / 2, this.mapComponent.mapContainer.h / 2);
        }

        this.mapComponent.notifyViewportUpdate()
        break
      }

      case WSEventName.mapFocus: {
        console.debug(event.data)

        // focus effect
        if (event.data.effect) {
          // create focus effect
          this.mapComponent.mapContainer.effectsLayer.drawFocus(event.data.x, event.data.y, event.data.color)
        }

        // skip if not moving
        if (!event.data.pan) {
          return
        }

        let viewport = this.mapComponent.viewport
        let scale = !this.state.screen.tableTopMode && event.data.zoom ? 1.0 : viewport.scale.x
        let remove = this.state.runMode == RunMode.normal
        let oldCenter = viewport.center
        let oldScale = viewport.scale.x

        // animate vieport center & zoom
        viewport.animate({
          position: new Point(event.data.x, event.data.y), scale: scale, time: 2000, ease: "easeInOutSine", removeOnInterrupt: remove, callbackOnComplete: (viewport: Viewport): void => {
            if (!event.data.reset) {
              this.mapComponent.notifyViewportUpdate()
            }
          }
        })

        // animate back
        if (event.data.reset) {
          setTimeout(() => {
            viewport.animate({ position: oldCenter, scale: oldScale, time: 2000, ease: "easeInOutSine", removeOnInterrupt: remove })
          }, 3000);
        }
      }

      case WSEventName.creatureUpdated: {
        // udpdate state
        let index = this.state.game.creatures.findIndex((obj => obj.id == event.data.id))
        let creature = this.state.game.creatures[index]

        if (creature) {
          Object.assign(creature, event.data)
        }

        // changes
        // console.debug(creature)
        break
      }

      case WSEventName.tokenMoved: {
        // console.debug(event.data)

        // check moving token view cache
        let view = this.movingTokenView
        if (view?.token.id != event.data.id) {
          view = this.mapComponent.mapContainer.tokenViewById(event.data.id)
          // update moving token view cache
          this.movingTokenView = view
        }
        if (view != null) {
          view.blocked = event.data.state == ControlState.block;

          if (!view.dragging && (view.token.trackingId == null || this.state.runMode == RunMode.normal)) {
            view.token.x = event.data.x;
            view.token.y = event.data.y;
            view.controlled = event.data.state != ControlState.end && !view.dragging ? true : false
            view.update();
            view.updateTint();
          }

          if (event.data.distance != null) {
            view.distance = event.data.distance;
            view.updateDistance()
          }
          

          if (event.data.path != null) {
            this.mapComponent.mapContainer.gridLayer.updateHighlight(event.data.path, view.gridSize, view.baseColor);
            this.mapComponent.mapContainer.gridLayer.drawHighlight();
          }

          if (event.data.state == ControlState.end) {
              // this.mapComponent.mapContainer.gridLayer.updateHighlight([], view.gridSize, view.color);
              // this.mapComponent.mapContainer.gridLayer.drawHighlight();
              view.distance = null
              view.updateDistance()
          }
        }

        if (event.data.polygon != null) {
          let index = this.state.map.tokens.findIndex((obj => obj.id == event.data.id));
          if (index !== undefined && index !== null) {
            this.state.map.tokens[index].x = event.data.x;
            this.state.map.tokens[index].y = event.data.y;
            if (this.state.map.tokens[index].vision) {
              this.state.map.tokens[index].vision.sight.x = event.data.x;
              this.state.map.tokens[index].vision.sight.y = event.data.y;
              this.state.map.tokens[index].vision.sight.polygon = event.data.polygon;

              // clear cache
              CacheManager.sightPolygon.delete(this.state.map.tokens[index].vision.id)
              CacheManager.geometryPolygon.delete(this.state.map.tokens[index].vision.id)
            }

            this.mapComponent.mapContainer.visionLayer.draw();
            this.mapComponent.mapContainer.lightsLayer.draw();
          }
        }
        break;
      }

      case WSEventName.tokenUpdated: {
        let model = Object.assign(new Token, event.data) as Token

        // udpdate state
        let index = this.state.map.tokens.findIndex((obj => obj.id == model.id))
        this.state.map.tokens[index] = model

        let view = this.mapComponent.mapContainer.tokenViewById(model.id)
        if (view != null) {
          // update token only
          view.token = model;
          view.controlled = false
          view.dragging = false
          view.draw();
        } else {
          // update all tokens
          this.mapComponent.mapContainer.updateTokens()
          this.mapComponent.mapContainer.drawTokens()
        }

        if (model.vision != null) {
          // update los & ligts
          this.mapComponent.mapContainer.lightsLayer.update()
          this.mapComponent.mapContainer.visionLayer.update()
          this.mapComponent.mapContainer.visionLayer.draw()
          this.mapComponent.mapContainer.lightsLayer.draw()
        }

        // changes
        // console.debug(model)
        break
      }

      case WSEventName.areaEffectUpdated: {
        let model = Object.assign(new AreaEffect, event.data) as AreaEffect;
        console.debug(model);

        // udpdate state
        let index = this.state.map.areaEffects.findIndex((obj => obj.id == model.id));
        this.state.map.areaEffects[index] = model;

        let view = this.mapComponent.mapContainer.areaEffectViewById(model.id)
        if (view != null) {
          view.areaEffect = model;
          view.draw();
        }
        break;
      }

      case WSEventName.measurementUpdated: {
        let model = Object.assign(new Measurement, event.data) as Measurement;
        console.debug(model);

        // udpdate state
        let index = this.state.map.measurements.findIndex((obj => obj.id == model.id));
        this.state.map.measurements[index] = model;

        let view = this.mapComponent.mapContainer.measurementViewById(model.id)
        if (view != null) {
          view.measurement = model;
          view.draw();
        }
        break;
      }

      case WSEventName.tileUpdated: {
        let model = Object.assign(new Tile, event.data) as Tile;
        console.debug(model);

        // udpdate state
        let index = this.state.map.tiles.findIndex((obj => obj.id == model.id));
        this.state.map.tiles[index] = model;

        let view = this.mapComponent.mapContainer.tileViewById(model.id)
        if (view != null && view.mapLayer == model.layer) {
          // update tile only
          view.tile = model;
          view.draw();
        } else {
          // update all tiles
          this.mapComponent.mapContainer.updateTiles()
          this.mapComponent.mapContainer.drawTiles()
        }

        if (model.light != null) {
          this.mapComponent.mapContainer.lightsLayer.update()
          this.mapComponent.mapContainer.visionLayer.update()
          this.mapComponent.mapContainer.visionLayer.draw()
          this.mapComponent.mapContainer.lightsLayer.draw()
        }

        break;
      }

      case WSEventName.lightUpdated: {
        let model = Object.assign(new Light, event.data) as Light
        console.debug(model)

        // udpdate state
        let index = this.state.map.lights.findIndex((obj => obj.id == model.id))
        this.state.map.lights[index] = model

        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.fogUpdated: {
        let base64image = event.data.image;

        this.mapComponent.mapContainer.visionLayer.updateFogFromData(base64image)
        // this.mapComponent.mapContainer.visionLayer.draw()
        break;
      }

      case WSEventName.mapLoaded: {
        // get new data from API and redraw everything
        this.getData();
        break;
      }

      case WSEventName.interactionUpdated: {
        this.state.screen.interaction = event.data;
        this.mapComponent.mapContainer.updateInteraction();
        break;
      }

      case WSEventName.pointerUpdated: {
        this.mapComponent.mapContainer.effectsLayer.drawPointer(event.data);
        break;
      }

      case WSEventName.drawingsUpdated: {
        this.state.map.drawings = event.data;
        this.mapComponent.mapContainer.drawingsLayer.update();
        this.mapComponent.mapContainer.drawingsLayer.draw()
        break;
      }

      case WSEventName.markerMoved: {
        let view = this.mapComponent.mapContainer.markerViewById(event.data.id);
        if (view != null) {
          view.marker.x = event.data.x;
          view.marker.y = event.data.y;
          view.update();
        }
        break;
      }

      case WSEventName.markerUpdated: {
        let model = Object.assign(new Marker, event.data) as Marker;
        console.debug(model);

        // udpdate state
        let index = this.state.map.markers.findIndex((obj => obj.id == model.id));
        this.state.map.markers[index] = model;

        let view = this.mapComponent.mapContainer.markerViewById(model.id)
        if (view != null) {
          view.marker = model;
          view.draw();
        }

        break;
      }

      case WSEventName.markersUpdated: {
        this.state.map.markers = event.data;
        this.mapComponent.mapContainer.markersLayer.update();
        this.mapComponent.mapContainer.markersLayer.draw()
        break;
      }

      case WSEventName.areaEffectsUpdated: {
        this.state.map.areaEffects = event.data;
        this.mapComponent.mapContainer.areaEffectsLayer.update();
        this.mapComponent.mapContainer.areaEffectsLayer.draw()
        break;
      }

      case WSEventName.measurementsUpdated: {
        this.state.map.measurements = event.data;
        this.mapComponent.mapContainer.measurementsLayer.update();
        this.mapComponent.mapContainer.measurementsLayer.draw()
        break;
      }

      case WSEventName.tilesUpdated: {
        this.state.map.tiles = event.data
        this.mapComponent.mapContainer.updateTiles()
        this.mapComponent.mapContainer.drawTiles()

        // update los & ligts
        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.lightsUpdated: {
        this.state.map.lights = event.data

        console.debug(this.state.map.lights)

        // update los & ligts
        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.tokensUpdated: {
        this.state.map.tokens = event.data
        this.mapComponent.mapContainer.updateTokens()
        this.mapComponent.mapContainer.drawTokens()

        // update los & ligts
        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.screenUpdated: {
        let tableTopMode = this.state.screen.tableTopMode
        this.state.screen = event.data;

        // fit scren for tabletop mode
        if (tableTopMode != this.state.screen.tableTopMode && this.state.screen.tableTopMode) {
          const mapGridSize = this.mapComponent.mapContainer.grid.adjustedSize.width
          const screenGridSize = this.mapComponent.viewport.screenWidth / this.state.screen.width
          let scale = screenGridSize / mapGridSize

          // set zoom
          this.mapComponent.viewport.setZoom(scale)

          // set center
          const x = ((this.state.map.x / this.state.map.zoom) + (this.mapComponent.mapContainer.w / 2))
          const y = ((this.state.map.y / this.state.map.zoom) + (this.mapComponent.mapContainer.h / 2))
          this.mapComponent.viewport.moveCenter(x, y)

          this.mapComponent.notifyViewportUpdate()
        }

        // render los & ligts
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.lineOfSightUpdated: {
        // console.log(event.data);
        for (let sight of event.data as Array<Sight>) {
          // search tokens
          if (sight.key.includes("vision-")) {
            for (let token of this.state.map.tokens) {
              if (token.vision?.sight?.key == sight.key) {
                token.vision.sight = sight
                break
              }
            }
          }

          // search tiles and lights
          if (sight.key.includes("light-")) {
            for (let tile of this.state.map.tiles) {
              if (tile.light?.sight?.key == sight.key || tile.light?.id == sight.key.slice(6)) {
                tile.light.sight = sight
                break
              }
            }

            for (let light of this.state.map.lights) {
              if (light.sight?.key == sight.key || light.id == sight.key.slice(6)) {
                light.sight = sight
                break
              }
            }
          }
        }

        // update los & ligts
        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.messageCreated: {
        this.state.messages.push(event.data);
        if (this.messages) {
          let lastHost = localStorage.getItem("lastSuccessfullHost");
          localStorage.setItem("readMessages", JSON.stringify({ "lastHost": lastHost, seenCount: this.state.messages.length }));
          this.state.readCount = this.state.messages.length;
        }
        // this.toastService.showMessage(event.data);
        // this.messageListComponent.scrollToBottom();
        break;
      }

      case WSEventName.trackedObjectCreated: {
        let model = Object.assign(new TrackedObject, event.data) as TrackedObject
        let index = this.state.trackedObjects.findIndex((obj => obj.id == model.id))
        if (index > -1) {
          this.state.trackedObjects[index] = model
        } else {
          this.state.trackedObjects.push(model)
        }

        this.mapComponent.trackedObjectsContainer.update()
        this.mapComponent.trackedObjectsContainer.draw()

        break;
      }

      case WSEventName.trackedObjectDeleted: {
        let model = Object.assign(new TrackedObject, event.data) as TrackedObject
        let index = this.state.trackedObjects.findIndex((obj => obj.id == model.id))
        if (index > -1) {
          this.state.trackedObjects.splice(index, 1);
        }

        this.mapComponent.trackedObjectsContainer.update()
        this.mapComponent.trackedObjectsContainer.draw()

        break;
      }

      case WSEventName.trackedObjectUpdated: {
        let model = Object.assign(new TrackedObject, event.data) as TrackedObject
        let index = this.state.trackedObjects.findIndex((obj => obj.id == model.id))
        if (index > -1) {
          this.state.trackedObjects[index] = model
        }

        // update tracked object view
        const trackedObjectView = this.mapComponent.trackedObjectsContainer.trackedObjectViewById(model.id)
        if (trackedObjectView) {
          trackedObjectView.trackedObject = model
          trackedObjectView.draw()
        }

        // check moving token view cache
        let view = this.movingTokenView
        if (view?.token.trackingId != model.id) {
          view = this.mapComponent.mapContainer.tokenViewByTrackingId(model.id)
          // update moving token view cache
          this.movingTokenView = view
        }

        // calculate center position relative to map
        const center = this.mapComponent.convertScreenToMap(model.x, model.y)

        // update token view poisition
        if (view) {
          if (view.blocked) {
            break
          }

          // positioon
          view.token.x = center.x
          view.token.y = center.y

          // angle
          if (model.angle) {
            view.token.rotation = model.angle
          }
          view.update()
        }

        break;
      }

      case WSEventName.trackedObjectsUpdated: {
        // console.debug(event.data)
        this.state.trackedObjects = event.data
        this.mapComponent.trackedObjectsContainer.update()
        this.mapComponent.trackedObjectsContainer.draw()

        break;
      }

    }
  }

  // get data from JSON API
  getData() {
    this.dataService.getData().subscribe((data: ApiData) => {
      this.state.game = data.game
      this.state.map = data.map
      this.state.screen = data.screen
      this.state.messages = data.messages
      this.state.trackedObjects = data.trackedObjects
      this.state.version = data.version
      this.state.build = data.build

      this.dataService.state = this.state

      if (this.state.map != undefined) {
        this.mapComponent.isReady = true
        this.mapComponent.update()
        this.mapComponent.draw()
      }
      // console.debug(this.state);

      // legacy build check
      if (data.build < 2280 && data.build != 1) {
        this.toastService.showError("Incompatible server version: " + data.version + " || Please use: http://legacy-client.encounter.plus/?remoteHost=" + this.dataService.remoteHost, false);
      }

    }, err => this.toastService.showError("API error: " + err));
  }

  wsConnect() {
    this.dataService.connect();
    this.dataService.events$.subscribe(event => {
      this.handleEvent(event);
    }, err => this.toastService.showError("Websocket error: " + err), () => this.toastService.showSuccess("Websocket connected"));
  }

  configureRemoteHost() {
    let urlParams = new URLSearchParams(window.location.search);
    let remoteHost = urlParams.get('remoteHost') || localStorage.getItem("lastSuccessfullHost") || window.location.host;
    this.dataService.remoteHost = remoteHost;
    this.dataService.protocol = window.location.protocol;
    Loader.shared.remoteBaseURL = this.dataService.baseURL;
  }

  configureParams() {
    let urlParams = new URLSearchParams(window.location.search);
    this.state.deviceType = urlParams.get('deviceType')
    this.state.viewMode = ViewMode[urlParams.get('viewMode') || "player"] || ViewMode.player
    this.state.runMode = RunMode[urlParams.get('runMode') || localStorage.getItem("runMode") || ""] || (this.state.deviceType ? RunMode.tv : RunMode.normal)
    this.state.allInteractions = urlParams.get('interactions') == "all"
  }

  get zoomControls(): boolean {
    return this.state.map && this.state.runMode == RunMode.normal
  }

  ngOnInit() {

    // init user color
    let color = localStorage.getItem("userColor");
    if (!color) {
      localStorage.setItem("userColor", '#' + (Math.random() * 0xFFFFFF << 0).toString(16));
    }

    // update messages based on local storage settings
    this.messages = (localStorage.getItem("activePanel") || Panel.none) == Panel.messages;

    this.configureRemoteHost()
    this.configureParams()
    this.wsConnect()

    this.showBanner()

    this.dataService.connectionStatus$.subscribe(status => {
      if (status) {
        console.log("Websocket connected");

        // this should be in data service, not here
        this.dataService.attemptNr = 0;

        localStorage.setItem("lastSuccessfullHost", this.dataService.remoteHost);

        this.toastService.clear();
        this.toastService.showSuccess("Websocket connected");
        this.getData();

        // update color
        let name = localStorage.getItem("userName") || "Unknown";
        let color = localStorage.getItem("userColor");
        this.dataService.send({ name: WSEventName.clientUpdated, data: { name: name, color: color, runMode: this.state.runMode, screenWidth: innerWidth, screenHeight: innerHeight } });

        let readMessages = JSON.parse(localStorage.getItem("readMessages"));
        if (readMessages && readMessages.lastHost == this.dataService.remoteHost) {
          this.state.readCount = readMessages.seenCount;
        }

        if (typeof appInterface !== "undefined") {
          appInterface.wsConnected(this.dataService.remoteHost)
        }

      } else {
        console.log("Websocket disconnected");
        this.toastService.showError("Websocket disconnected", false);
      }
    });
  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {
    this.destroy$.next(true);
    // Unsubscribe from the subject
    this.destroy$.unsubscribe();
  }

  showBanner() {
    const consoleOptions = 'font-family: "Courier New", Courier, monospace; color: magenta';
    console.log(
      `%c 
 ______ _   _  _____ ____  _    _ _   _ _______ ______ _____       
|  ____| \\ | |/ ____/ __ \\| |  | | \\ | |__   __|  ____|  __ \\  _   
| |__  |  \\| | |   | |  | | |  | |  \\| |  | |  | |__  | |__) || |_ 
|  __| | . \` | |   | |  | | |  | | . \` |  | |  |  __| |  _  /_   _|
| |____| |\\  | |___| |__| | |__| | |\\  |  | |  | |____| | \\ \\ |_|  
|______|_| \\_|\\_____\\____/ \\____/|_| \\_|  |_|  |______|_|  \\_\\     

`, consoleOptions)

    console.info(`Web Client Version: ${environment.version}`)
    console.info(`Remote Host: ${this.dataService.remoteHost}`)
    console.info(`Run mode: ${this.state.runMode}, Interactions: ${this.state.allInteractions}`)
  }
}
