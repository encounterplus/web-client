import { Component, OnInit, ViewChild, AfterViewInit, signal, computed, ChangeDetectionStrategy, WritableSignal } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService, deepMerge} from './shared/services/data.service';
import { environment } from 'src/environments/environment';
import { AppState, parseRunMode, parseViewMode, RunMode, ViewMode } from './shared/models/app-state';
import { WSEventName, WSEvent } from './shared/models/wsevent';
import { ControlState, TokenView } from './core/map/views/token-view';
import { AreaEffect } from './shared/models/area-effect';
import { Tile, tileLayer } from './shared/models/tile';
import { ToolbarComponent, Tool, Panel, PanelChange, savedPanelState, savePanelState, MeasurementToolOptions, AreaTemplateToolOptions } from './core/toolbar/toolbar.component';
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
import { CacheManager, Utils } from './shared/utils';
import { SharedVision } from './shared/models/screen';
import { TrackedObject } from './shared/models/tracked-object';
import { Measurement } from './shared/models/measurement';
import { Point } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { ZoombarComponent } from './core/zoombar/zoombar.component';
import { Meta } from '@angular/platform-browser';
import { Message } from './shared/models/message';
import { Game, emptyGame } from './shared/models/game';
import { Screen } from './shared/models/screen';
import { ActiveCombatant, Combatant, Role } from './shared/models/combatant';
import { PlayerEffect, assignedPlayerCombatant } from './shared/player-tools';
import { EntityReferenceAction } from './shared/entity-frame-interactions';
import { InitiativeDockPosition, storedInitiativeDockPosition } from './core/initiative-list/initiative-dock';

interface EntityWindowState {
  title: string;
  reference?: string;
  description?: string;
}

interface TurnNoticeState {
  combatantId: string;
  name: string;
  round?: number;
}

interface WebAppInterface {
  showText(text: string): any;
  wsConnected(remoteHost: string): any;
  exit(): any;
}

declare var appInterface: WebAppInterface;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'external-screen';

  env = environment;

  state: AppState;

  characterWindow?: EntityWindowState;
  referenceWindow?: EntityWindowState;
  characterWindowZ = 1060;
  referenceWindowZ = 1061;

  readonly turnNotice = signal<TurnNoticeState | undefined>(undefined);
  readonly playerStateRevision = signal(0);
  playerColor = Utils.userColor();
  initiativeDockPosition: InitiativeDockPosition = storedInitiativeDockPosition();
  private turnNoticeKey?: string;
  private turnNoticeTimer?: ReturnType<typeof setTimeout>;

  destroy$: Subject<boolean> = new Subject<boolean>();

  private readonly _messages = signal<Message[]>([])
  readonly messages = this._messages.asReadonly()

  updateMessages(messages: Message[]) {
     this._messages.update((value) => messages);
  }

  private readonly _game = signal<Game>(emptyGame())
  readonly game = this._game.asReadonly()

  activeCombatants = computed(() => {
    var array = Array<ActiveCombatant>()
    
    console.debug("updating active combatants")

    let initiativeId = this._game().initiativeId

    for (let combatant of this._game().combatants.filter(combatant => combatant.initiative && (combatant.role != Role.hostile || !combatant.hidden))) {
      for (let initiative of combatant.initiative ?? []) {
        if (initiative.order) {
          array.push({id: initiative.id + combatant.id, turned: initiative.id == initiativeId, initiative: initiative, combatant: combatant})
        }
      }
    }
    
    return array.sort((a, b) => ((a.initiative.order ?? 0) > (b.initiative.order ?? 0)) ? 1 : -1);
  });

  // // initiativeId = signal<string | null>(null);
  initiativeId = computed(() => {
    return this._game().initiativeId
  });

  updateGame(game: Game) {
    this._game.update(state => deepMerge(state, game));
  }

  // used in toolbar
  unreadMessages = signal(0)

  // to display game paused animation
  paused = signal(false)

  // for overlay images; seeded from the state, which holds the default screen
  screen: WritableSignal<Screen>

  updateScreen(screen: Screen) {
    // this.screen.update(state => deepMerge(state, screen));
    this.screen.set(screen)
  }

  private refreshPlayerState(): void {
    // The panel receives one long-lived AppState object. A primitive revision input tells Angular
    // that its mutable contents changed, so zoneless rendering does not wait for user interaction.
    this.playerStateRevision.update(revision => revision + 1)
  }

  @ViewChild(MapComponent)
  public mapComponent!: MapComponent;

  @ViewChild(InitiativeListComponent)
  public initiativeListComponent!: InitiativeListComponent;

  @ViewChild(MessageListComponent)
  public messageListComponent!: MessageListComponent;

  @ViewChild(ToolbarComponent)
  public toolbarComponent!: ToolbarComponent;

  @ViewChild(ZoombarComponent)
  public zoombarComponent!: ZoombarComponent;

  @ViewChild(ToastListComponent)
  public toastListComponent!: ToastListComponent;

  constructor(private metaService: Meta, private dataService: DataService, private toastService: ToastService, private modalService: NgbModal) {
    this.state = new AppState();
    this.screen = signal(this.state.screen)

    window['state'] = this.state
    window['componentRef'] = {
      componentFn: (value) => this.handleExternalEvent(value),
      component: this
    };
  }

  handleExternalEvent(data: WSEvent) {
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

  showMessages: boolean = false;
  showPlayerPanel: boolean = false;
  movingTokenView: TokenView | null = null

  toolbarAction(type: string) {
    console.log(type);
    switch (type) {
      case "showSettings":
        // pause viewport events to prevent interactions with map
        if (this.mapComponent) {
          this.mapComponent.viewport.pause = true
        }

        let modal = this.modalService.open(SettingsModalComponent, {
          centered: true,
          windowClass: 'settings-modal-layer',
          backdropClass: 'settings-modal-backdrop',
        })
        modal.componentInstance.state = this.state
        const playedVideoAssets = Loader.playsVideoAssets
        modal.result.then(result => {
          console.debug(`Settings component closed with: ${result}`);

          if (this.mapComponent) {
            // update maxFPS
            this.mapComponent.app.ticker.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60;
            // switch video assets between playing and a still frame
            if (Loader.playsVideoAssets != playedVideoAssets) {
              this.mapComponent.mapContainer.redrawVideoAssets()
            }
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

          this.playerColor = Utils.userColor();
          // Settings mutates the long-lived AppState object when the assigned token changes.
          // Bump the panel input so an already-open My Character panel renders the new token
          // immediately instead of waiting for the next click or websocket event.
          this.refreshPlayerState();
          this.updateTurnNotice();

        }, reason => {
          console.debug(`Setting component dismissed ${reason}`)
          // unpause viewport events
          if (this.mapComponent) {
            this.mapComponent.viewport.pause = false
          }
        });
        break;
      case "showAbout":
        this.modalService.open(AboutModalComponent, {centered: true}).result.then(result => {
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
        const userTokenId = localStorage.getItem("userTokenId")
        let view = userTokenId ? this.mapComponent.mapContainer.tokenViewById(userTokenId) : null
        if (view) {
          this.mapComponent.viewport.animate({ position: view.position, scale: 1.0, time: 2000, ease: "easeInOutSine", removeOnInterrupt: true })
        }
        break;
    }
  }

  activeToolAction(tool: Tool) {
    if (this.mapComponent) {
      if (this.toolbarComponent) {
        this.mapComponent.mapContainer.setMeasurementOptions(
          this.toolbarComponent.measurementType,
          this.toolbarComponent.saveMeasurements
        )
        this.mapComponent.mapContainer.setAreaTemplateOptions(
          this.toolbarComponent.areaTemplateShape
        )
      }
      this.mapComponent.mapContainer.setActiveTool(tool)
    }
  }

  measurementToolOptionsChanged(options: MeasurementToolOptions) {
    if (this.mapComponent?.mapContainer) {
      this.mapComponent.mapContainer.setMeasurementOptions(options.type, options.save)
    }
  }

  areaTemplateToolOptionsChanged(options: AreaTemplateToolOptions) {
    if (this.mapComponent?.mapContainer) {
      this.mapComponent.mapContainer.setAreaTemplateOptions(options.shape)
    }
  }

  clearAreaTemplatePreview() {
    this.mapComponent?.mapContainer?.clearLocalAreaTemplate()
  }

  activePanelAction(change: PanelChange) {
    if (change.panel == Panel.messages) {
      this.showMessages = change.open;
    } else if (change.panel == Panel.player) {
      this.showPlayerPanel = change.open;
    }

    if (change.panel == Panel.messages && change.open) {
      let lastHost = localStorage.getItem("lastSuccessfullHost");
      localStorage.setItem("readMessages", JSON.stringify({ "lastHost": lastHost, seenCount: this.state.messages.length }));
      this.state.readCount = this.state.messages.length;
      this.unreadMessages.set(this.state.messages.length - this.state.readCount)
    }
  }

  closePlayerPanel() {
    this.showPlayerPanel = false;
    savePanelState(Panel.player, false);
    if (this.toolbarComponent) this.toolbarComponent.player = false;
  }

  showCharacterSheet(reference: string) {
    this.characterWindow = { title: 'Character', reference };
    this.focusFloatingWindow('character');
  }

  showEntityAction(reference: string, title = 'Reference') {
    this.referenceWindow = { title, reference };
    this.focusFloatingWindow('reference');
  }

  showReferenceAction(action: EntityReferenceAction) {
    this.showEntityAction(action.reference, action.title);
  }

  showEffectAction(effect: PlayerEffect) {
    if (effect.reference) {
      this.showEntityAction(effect.reference, effect.name);
      return;
    }
    if (!effect.description) return;

    this.referenceWindow = { title: effect.name, description: effect.description };
    this.focusFloatingWindow('reference');
  }

  closeFloatingWindow(window: 'character' | 'reference') {
    if (window === 'character') this.characterWindow = undefined;
    else this.referenceWindow = undefined;
  }

  focusFloatingWindow(window: 'character' | 'reference') {
    if (window === 'character') {
      this.characterWindowZ = 1061;
      this.referenceWindowZ = 1060;
    } else {
      this.characterWindowZ = 1060;
      this.referenceWindowZ = 1061;
    }
  }

  dismissTurnNotice() {
    this.turnNotice.set(undefined);
    if (this.turnNoticeTimer) {
      clearTimeout(this.turnNoticeTimer);
      this.turnNoticeTimer = undefined;
    }
  }

  initiativeDockPositionChanged(position: InitiativeDockPosition) {
    this.initiativeDockPosition = position;
  }

  private updateTurnNotice() {
    const combatant = assignedPlayerCombatant(this.state);
    const isPlayersTurn = Boolean(
      this.state.game.started &&
      combatant &&
      this.state.game.combatantId === combatant.id
    );

    if (!isPlayersTurn || !combatant) {
      this.turnNoticeKey = undefined;
      this.dismissTurnNotice();
      return;
    }

    const key = `${combatant.id}:${this.state.game.round}:${this.state.game.turn}`;
    if (key === this.turnNoticeKey) return;

    this.turnNoticeKey = key;
    this.turnNotice.set({
      combatantId: combatant.id,
      name: combatant.name || combatant.label || 'Your character',
      round: this.state.game.round || undefined,
    });

    if (this.turnNoticeTimer) clearTimeout(this.turnNoticeTimer);
    this.turnNoticeTimer = setTimeout(() => {
      this.turnNotice.set(undefined);
      this.turnNoticeTimer = undefined;
    }, 7000);
  }

  // main websocket event handler
  handleEvent(event: WSEvent) {
    // console.debug(`Event received: ${event.name}`)
    // console.log(JSON.stringify(event));

    switch (event.name) {

      case WSEventName.systemPaused: {
        this.state.paused = event.data
        this.paused.set(this.state.paused)
        break
      }
      
      case WSEventName.gameUpdated: {
        // detect changes, very primitive
        const turnChanged = this.state.game.turn != event.data.turn
        const initiativeChanged = this.state.game.initiativeId != event.data.initiativeId
        const combatantChanged = this.state.game.combatantId != event.data.combatantId
        const roundChanged = this.state.game.round != event.data.round
        const startedChanged = this.state.game.started != event.data.started
        
        if (turnChanged) {
          this.state.game.turn = event.data.turn
        }
        if (initiativeChanged) {
          this.state.game.initiativeId = event.data.initiativeId
        }
        if (combatantChanged) {
          this.state.game.combatantId = event.data.combatantId
        }
        if (roundChanged) {
          this.state.game.round = event.data.round
        }
        if (startedChanged) {
          this.state.game.started = event.data.started
        }
        
        if (event.data.combatants) {
          this.state.game.combatants = event.data.combatants;
          this.mapComponent.mapContainer.update(this.state);
          this.mapComponent.mapContainer.draw();
        }
        
        // update state
        this.updateGame(this.state.game)
        this.updateTurnNotice()

        if (this.initiativeListComponent) {
          this.initiativeListComponent.scrollToTurned(this.state.game.initiativeId)
        }

        if (this.mapComponent) {
          this.mapComponent.mapContainer.updateInteraction()
          this.mapComponent.mapContainer.updateTurned(this.state.turned)

          // sigh
          if (!event.data.combatant && (turnChanged || roundChanged || startedChanged || initiativeChanged || combatantChanged)) {
            this.mapComponent.mapContainer.resetPaths()
          }
        }

        // this could be more optimised
        if (this.state.screen.sharedVision != SharedVision.always) {
          this.mapComponent.mapContainer.visionLayer.draw()
          this.mapComponent.mapContainer.lightsLayer.draw()
        }

        this.refreshPlayerState()

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

        const map = this.state.map
        if (!map) break

        if (event.data.x && event.data.y) {
          map.x = event.data.x
          map.y = event.data.y
        }

        if (event.data.zoom) {
          map.zoom = event.data.zoom
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
          const x = ((map.x ) + (this.mapComponent.mapContainer.w / 2))
          const y = ((map.y ) + (this.mapComponent.mapContainer.h / 2))
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
        if (this.state.runMode != RunMode.tv) {
          return
        } 
        if (this.state.screen.tableTopMode) {
          const mapGridSize = this.mapComponent.mapContainer.grid.adjustedSize.width
          const screenGridSize = this.mapComponent.viewport.screenWidth / this.state.screen.width
          let scale = screenGridSize / mapGridSize

          // set zoom
          this.mapComponent.viewport.setZoom(scale)

          // set center
          const map = this.state.map
          if (map) {
            const x = ((map.x / map.zoom) + (this.mapComponent.mapContainer.w / 2))
            const y = ((map.y / map.zoom) + (this.mapComponent.mapContainer.h / 2))
            this.mapComponent.viewport.moveCenter(x, y)
          }
        } else {
          this.mapComponent.viewport.fitWorld(true)
          this.mapComponent.viewport.moveCenter(this.mapComponent.mapContainer.w / 2, this.mapComponent.mapContainer.h / 2);
        }

        this.mapComponent.notifyViewportUpdate()
        break
      }

      case WSEventName.mapFocus: {
        // console.debug(event.data)

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

      case WSEventName.combatantUpdated: {
        // udpdate state
        let index = this.state.game.combatants.findIndex((obj => obj.id == event.data.id))
        let combatant = this.state.game.combatants[index]

        if (combatant) {
          Object.assign(combatant, event.data)
        }

        // Keep model state current even when no token view is mounted.
        const tokenId = event.data.tokenId ?? combatant?.tokenId
        const token = tokenId ? this.state.map?.tokens.find(token => token.id === tokenId) : undefined
        if (token) {
          token.combatant = Object.assign(token.combatant ?? {}, event.data) as Combatant
        }

        // The rendered token may hold its own combatant copy.
        const tokenView = tokenId ? this.mapComponent?.mapContainer.tokenViewById(tokenId) : null
        if (tokenView != null) {
          tokenView.token.combatant = Object.assign(tokenView.token.combatant ?? {}, event.data)
          tokenView.updateEffects()
        }

        // update state
        this.updateGame(this.state.game)
        this.refreshPlayerState()

        // changes
        // console.debug(creature)
        break
      }

      case WSEventName.tokenMoved: {
        // console.debug(event.data)
        // if (event.data.state != ControlState.control) {
        //   console.debug(JSON.stringify(event.data))
        // }
      
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
            // console.debug("tokenMoved: updating token position")
            view.token.x = event.data.x;
            view.token.y = event.data.y;
            view.controlled = event.data.state != ControlState.end && !view.dragging ? true : false
            view.update();
            view.updateTint();
          }
          
          // fix for stuck token when tokenMoved event is received after touch drag
          if (event.data.ControlState == ControlState.end) {
            view.controlled = false
          }

          if (event.data.path != null) {
            view.token.path = event.data.path
            view.drawPath()
            view.updateElevation()
          }
        }

        if (event.data.polygon != null) {
          const token = this.state.map?.tokens.find(obj => obj.id == event.data.id);
          if (token) {
            token.x = event.data.x;
            token.y = event.data.y;
            const vision = token.vision
            if (vision?.sight) {
              vision.sight.x = event.data.x;
              vision.sight.y = event.data.y;
              vision.sight.polygon = event.data.polygon;

              // clear cache
              CacheManager.sightPolygon.delete(vision.id)
              CacheManager.geometryPolygon.delete(vision.id)
            }

            this.mapComponent.mapContainer.visionLayer.draw();
            this.mapComponent.mapContainer.lightsLayer.draw();
          }
        }
        break;
      }

      case WSEventName.tokenUpdated: {
        let model = { ...event.data } as Token

        // udpdate state
        const map = this.state.map
        if (!map) break

        Utils.upsertById(map.tokens, model)

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

        // The assigned character can fall back to the combatant embedded in its token.
        this.refreshPlayerState()

        // changes
        // console.debug(model)
        break
      }

      case WSEventName.areaEffectUpdated: {
        let model = event.data as AreaEffect;
        console.debug(model);

        // udpdate state
        const map = this.state.map
        if (!map) break

        Utils.upsertById(map.areaEffects, model)

        let view = this.mapComponent.mapContainer.areaEffectViewById(model.id)
        if (view != null) {
          view.areaEffect = model;
          view.draw();
        }
        break;
      }

      case WSEventName.measurementUpdated: {
        let model = event.data as Measurement;
        console.debug(model);

        // udpdate state
        const map = this.state.map
        if (!map) break

        Utils.upsertById(map.measurements, model)

        let view = this.mapComponent.mapContainer.measurementViewById(model.id)
        if (view != null) {
          view.measurement = model;
          view.draw();
        }
        break;
      }

      case WSEventName.tileUpdated: {
        let model = event.data as Tile;
        console.debug(model);

        // udpdate state
        const map = this.state.map
        if (!map) break

        Utils.upsertById(map.tiles, model)

        let view = this.mapComponent.mapContainer.tileViewById(model.id)
        // the view resolves an absent layer to the default, so read the event the same way
        if (view != null && view.mapLayer == tileLayer(model)) {
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
        let model = { ...event.data } as Light
        console.debug(model)

        // udpdate state
        const map = this.state.map
        if (!map) break

        Utils.upsertById(map.lights, model)

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
        const map = this.state.map
        if (!map) break

        map.drawings = event.data;
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
        let model = event.data as Marker;
        console.debug(model);

        // udpdate state
        const map = this.state.map
        if (!map) break

        Utils.upsertById(map.markers, model)

        let view = this.mapComponent.mapContainer.markerViewById(model.id)
        if (view != null) {
          view.marker = model;
          view.draw();
        }

        break;
      }

      case WSEventName.markersUpdated: {
        const map = this.state.map
        if (!map) break

        map.markers = event.data;
        this.mapComponent.mapContainer.markersLayer.update();
        this.mapComponent.mapContainer.markersLayer.draw()
        break;
      }

      case WSEventName.areaEffectsUpdated: {
        const map = this.state.map
        if (!map) break

        map.areaEffects = event.data;
        this.mapComponent.mapContainer.areaEffectsLayer.update();
        this.mapComponent.mapContainer.areaEffectsLayer.draw()
        break;
      }

      case WSEventName.measurementsUpdated: {
        const map = this.state.map
        if (!map) break

        map.measurements = event.data;
        this.mapComponent.mapContainer.measurementsLayer.update();
        this.mapComponent.mapContainer.measurementsLayer.draw()
        break;
      }

      case WSEventName.tilesUpdated: {
        const map = this.state.map
        if (!map) break

        map.tiles = event.data
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
        const map = this.state.map
        if (!map) break

        map.lights = event.data

        console.debug(map.lights)

        // update los & ligts
        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.tokensUpdated: {
        const map = this.state.map
        if (!map) break

        map.tokens = event.data
        this.mapComponent.mapContainer.updateTokens()
        this.mapComponent.mapContainer.drawTokens()

        // update los & ligts
        this.mapComponent.mapContainer.lightsLayer.update()
        this.mapComponent.mapContainer.visionLayer.update()
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        this.refreshPlayerState()
        break;
      }

      case WSEventName.screenUpdated: {
        let tableTopMode = this.state.screen.tableTopMode
        this.state.screen = event.data;

        this.updateScreen(this.state.screen)

        // fit scren for tabletop mode
        if (tableTopMode != this.state.screen.tableTopMode && this.state.screen.tableTopMode && this.state.runMode == RunMode.tv) {
          const mapGridSize = this.mapComponent.mapContainer.grid.adjustedSize.width
          const screenGridSize = this.mapComponent.viewport.screenWidth / this.state.screen.width
          let scale = screenGridSize / mapGridSize

          // set zoom
          this.mapComponent.viewport.setZoom(scale)

          // set center
          const map = this.state.map
          if (map) {
            const x = ((map.x / map.zoom) + (this.mapComponent.mapContainer.w / 2))
            const y = ((map.y / map.zoom) + (this.mapComponent.mapContainer.h / 2))
            this.mapComponent.viewport.moveCenter(x, y)
          }

          this.mapComponent.notifyViewportUpdate()
        }

        // render los & ligts
        this.mapComponent.mapContainer.visionLayer.draw()
        this.mapComponent.mapContainer.lightsLayer.draw()
        break;
      }

      case WSEventName.lineOfSightUpdated: {
        // console.log(event.data);
        const map = this.state.map
        if (!map) break

        for (let sight of event.data as Array<Sight>) {
          // search tokens
          if (sight.key.includes("vision-")) {
            for (let token of map.tokens) {
              const vision = token.vision
              if (vision && vision.sight?.key == sight.key) {
                vision.sight = sight
                break
              }
            }
          }

          // search tiles and lights
          if (sight.key.includes("light-")) {
            for (let tile of map.tiles) {
              const light = tile.light
              if (light && (light.sight?.key == sight.key || light.id == sight.key.slice(6))) {
                light.sight = sight
                break
              }
            }

            for (let light of map.lights) {
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
        
        if (this.showMessages) {
          let lastHost = localStorage.getItem("lastSuccessfullHost");
          localStorage.setItem("readMessages", JSON.stringify({ "lastHost": lastHost, seenCount: this.state.messages.length }));
          this.state.readCount = this.state.messages.length;
        }

        this.updateMessages([...this.state.messages])
        this.unreadMessages.set(this.state.messages.length - this.state.readCount)
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
        if (view?.token.trackingId != model.trackingId) {
          view = this.mapComponent.mapContainer.tokenViewByTrackingId(model.trackingId)
          // update moving token view cache
          this.movingTokenView = view
        }

        if (model.x == null || model.y == null) break

        // calculate center position relative to map
        const center = this.mapComponent.convertScreenToMap(model.x, model.y)

        // update token view poisition
        if (view) {
          if (view.blocked) {
            break
          }

          // console.debug("trackedObjectUpdated: updating token position")

          // position
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
      this.state.paused = data.paused
      this.state.version = data.version
      this.state.build = data.build

      this.dataService.state = this.state

      if (this.state.map != undefined && this.mapComponent.isReady) {
        console.debug("initial map data received, rendering map")
        this.mapComponent.update()
        this.mapComponent.draw()
      }
      // console.debug(this.state);

      // legacy build check
      if (data.build < 2280 && data.build != 1) {
        this.toastService.showError("Incompatible server version: " + data.version + " || Please use: http://legacy-client.encounter.plus/?remoteHost=" + this.dataService.remoteHost, false);
      }
      
      this.updateGame(this.state.game)
      this.updateTurnNotice()
      this.updateScreen(this.state.screen)
      this.updateMessages([...this.state.messages])

      this.unreadMessages.set(this.state.messages.length - this.state.readCount)
      this.paused.set(this.state.paused)
      this.refreshPlayerState()

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

    // set remote base path for client assets
    const baseHref = (document.getElementsByTagName('base')[0] || {}).href
    const basePath = baseHref?.substr(0, baseHref?.lastIndexOf("/"))
    if (basePath != null && basePath != "") {
      Loader.shared.localBaseURL = basePath
    }
    Loader.shared.remoteBaseURL = this.dataService.baseURL
  }

  configureParams() {
    let urlParams = new URLSearchParams(window.location.search);
    this.state.device = urlParams.get('device')
    this.state.viewMode = parseViewMode(urlParams.get('viewMode')) || ViewMode.player
    this.state.runMode = parseRunMode(urlParams.get('runMode') || localStorage.getItem("runMode")) || (this.state.device ? RunMode.tv : RunMode.normal)
    this.state.allInteractions = urlParams.get('interactions') == "all"

    // device scale hack for gameboard
    if (this.state.device == "gameboard") {
      this.metaService.updateTag({
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.5, maximum-scale=1.5, user-scalable=no'
      }, 'name=viewport');
    }
    
  }

  get zoomControls(): boolean {
    return this.state.map != null && this.state.runMode == RunMode.normal
  }

  ngOnInit() {

    // update messages based on local storage settings
    this.showMessages = savedPanelState(Panel.messages);
    this.showPlayerPanel = savedPanelState(Panel.player);

    // update settings
    this.state.userTokenId = localStorage.getItem("userTokenId") ?? undefined

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
        let color = Utils.userColor();
        this.dataService.send({ name: WSEventName.clientUpdated, data: { name: name, color: color, runMode: this.state.runMode, device: this.state.device, screenWidth: innerWidth, screenHeight: innerHeight } });

        const storedReadMessages = localStorage.getItem("readMessages");
        let readMessages = storedReadMessages ? JSON.parse(storedReadMessages) : null;
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

    this.dataService.showEntityEmitter.subscribe(reference => {
      this.showEntityAction(reference)
    });
  }

  ngAfterViewInit() {
  }

  ngAfterViewChecked() {
    // console.debug('app component checked');
  }

  ngOnDestroy() {
    this.dismissTurnNotice();
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
    console.info(`Run mode: ${this.state.runMode}, Interactions: ${this.state.allInteractions}, Device: ${this.state.device}`)
  }
}
