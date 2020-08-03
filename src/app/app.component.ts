import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService } from './shared/services/data.service';
import { environment } from 'src/environments/environment';
import { AppState } from './shared/models/app-state';
import { WSEventName, WSEvent } from './shared/models/wsevent';
import { ControlState } from './core/map/views/token-view';
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
import { Vision } from './shared/models/vision';
import { MessageListComponent } from './core/message-list/message-list.component';

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

    @ViewChild(ToastListComponent)
    public toastListComponent: ToastListComponent;

    constructor(private dataService: DataService, private toastService: ToastService, private modalService: NgbModal) { 
        this.state = new AppState();

        window['state'] = this.state;
    }

    messages: Boolean = false;

    toolbarAction(type: string) {
        console.log(type);
        switch (type) {
            case "showSettings":
                this.modalService.open(SettingsModalComponent).result.then(result => {
                    console.debug(`Settings component closed with: ${result}`);
                    // update maxFPS
                    this.mapComponent.app.ticker.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60;
                }, reason => {
                    console.debug(`Setting component dismissed ${reason}`)
                });
                break;
            case "showAbout":
                this.modalService.open(AboutModalComponent).result.then(result => {
                    console.debug(`About component closed with: ${result}`);
                }, reason => {
                    console.debug(`About component dismissed ${reason}`)
                });
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
		    localStorage.setItem("readMessages",JSON.stringify({"lastHost": lastHost, seenCount: this.state.messages.length}));
		    this.state.readCount = this.state.messages.length;
	    }
    }

    // main websocket event handler
    handleEvent(event: WSEvent) {
        console.log(`Event received: ${event.name}`)
        // console.log(JSON.stringify(event));

        switch (event.name) {

            case WSEventName.gameUpdated: {
                this.state.game.turn = event.data.turn;
                this.state.game.round = event.data.round;
                this.state.game.started = event.data.started;
    
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
                
                break;
            }

            case WSEventName.mapUpdated: {
                
                let map = this.state.map;

                if (map) {
                    Object.assign(map, event.data);
                }

                this.mapComponent.mapContainer.update(this.state);
                this.mapComponent.mapContainer.draw();
                break;
            }

            case WSEventName.creatureUpdated: {

                // udpdate state
                let index =  this.state.game.creatures.findIndex((obj => obj.id == event.data.id));
                let creature = this.state.game.creatures[index];

                if (creature) {
                    Object.assign(creature, event.data);
                }

                // changes
                console.debug(creature);

                // check for empty map
                if (!this.mapComponent) {
                    return;
                }

                // update token
                let token = this.mapComponent.mapContainer.tokenByCreatureId(event.data.id)
                if (token != null) {
                    // TODO: more efecient draw
                    token.draw();
                } else {
                    this.mapComponent.mapContainer.monstersLayer.creatures = this.state.mapMonsters;
                    this.mapComponent.mapContainer.playersLayer.creatures = this.state.mapPlayers;
                    
                    this.mapComponent.mapContainer.monstersLayer.draw();
                    this.mapComponent.mapContainer.playersLayer.draw();

                    this.mapComponent.mapContainer.aurasLayer.tokens = this.mapComponent.mapContainer.playersLayer.views;
                    this.mapComponent.mapContainer.aurasLayer.draw();
                }

                // update los & ligts
                this.mapComponent.mapContainer.lightsLayer.update();
                this.mapComponent.mapContainer.visionLayer.update()
                this.mapComponent.mapContainer.visionLayer.draw();
                this.mapComponent.mapContainer.lightsLayer.draw();

                break
            }

            case WSEventName.creatureMoved: {
                let view = this.mapComponent.mapContainer.tokenByCreatureId(event.data.id);
                if (view != null) {
                    view.blocked = event.data.state == ControlState.block;

                    if (!view.dragging) {
                        view.creature.x = event.data.x;
                        view.creature.y = event.data.y;
                        view.controlled = event.data.state != ControlState.end && !view.dragging ? true : false
                        view.update();
                        view.updateTint();
                    }

                    view.distance = event.data.distance;
                    view.updateDistance();

                    if (event.data.path != null) {
                        this.mapComponent.mapContainer.gridLayer.updateHighlight(event.data.path, view.creature.scale, view.color);
                        this.mapComponent.mapContainer.gridLayer.drawHighlight();
                    }

                    if (event.data.state == ControlState.end) {
                        this.mapComponent.mapContainer.gridLayer.updateHighlight([], view.creature.scale, view.color);
                        this.mapComponent.mapContainer.gridLayer.drawHighlight();
                    }
                }

                if (event.data.los != null) {
                    let index = this.state.game.creatures.findIndex((obj => obj.id == event.data.id));
                    if (index !== undefined && index !== null) {
                        this.state.game.creatures[index].x = event.data.x;
                        this.state.game.creatures[index].y = event.data.y;
                        if (this.state.game.creatures[index].vision) {
                            this.state.game.creatures[index].vision.x = event.data.x;
                            this.state.game.creatures[index].vision.y = event.data.y;
                            this.state.game.creatures[index].vision.polygon = event.data.los;
                        }
                    }
                }
                
                this.mapComponent.mapContainer.lightsLayer.draw();
                this.mapComponent.mapContainer.visionLayer.draw();
                break;
            }

            case WSEventName.areaEffectUpdated: {
                let model = Object.assign(new AreaEffect, event.data) as AreaEffect;
                console.debug(model);
    
                // udpdate state
                let index =  this.state.map.areaEffects.findIndex((obj => obj.id == model.id));
                this.state.map.areaEffects[index] = model;
    
                let view = this.mapComponent.mapContainer.areaEffectViewById(model.id)
                if (view != null) {
                    view.areaEffect = model;
                    view.draw();
                }
                break;
            }

            case WSEventName.tileUpdated: {
                let model = Object.assign(new Tile, event.data) as Tile;
                console.debug(model);

                // udpdate state
                let index =  this.state.map.tiles.findIndex((obj => obj.id == model.id));
                this.state.map.tiles[index] = model;

                let view = this.mapComponent.mapContainer.tileViewById(model.id)
                if (view != null && view.mapLayer == model.layer) {
                    // update tile only
                    view.tile = model;
                    view.draw();
                } else {
                    // update all tiles
                    this.mapComponent.mapContainer.updateTiles(this.state.map.tiles);
                    this.mapComponent.mapContainer.drawTiles();
                }

                if (event.data.los != null) {
                    let index =  this.state.map.tiles.findIndex((obj => obj.id == event.data.id));
                    this.state.map.tiles[index].x = event.data.x;
                    this.state.map.tiles[index].y = event.data.y;
                    this.state.map.tiles[index].vision.x = event.data.x;
                    this.state.map.tiles[index].vision.y = event.data.y;
                    this.state.map.tiles[index].vision.polygon = event.data.los;
                }
                
                // update los & ligts
                this.mapComponent.mapContainer.lightsLayer.update();
                this.mapComponent.mapContainer.visionLayer.update()
                this.mapComponent.mapContainer.visionLayer.draw();
                this.mapComponent.mapContainer.lightsLayer.draw();
                break;
            }

            case WSEventName.fogUpdated: {
                let base64image = event.data.image;

                this.mapComponent.mapContainer.fogLayer.fogBase64 = base64image;
                this.mapComponent.mapContainer.fogLayer.drawPartialFog();
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
                let index =  this.state.map.markers.findIndex((obj => obj.id == model.id));
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

            case WSEventName.tilesUpdated: {
                this.state.map.tiles = event.data;
                this.mapComponent.mapContainer.updateTiles(event.data);
                this.mapComponent.mapContainer.drawTiles();
                break;
            }

            case WSEventName.screenUpdated: {
                this.state.screen = event.data;
                break;
            }

            case WSEventName.lineOfSightUpdated: {
                // console.log(event.data);
                for(let vision of event.data as Array<Vision>) {
                    // search creature
                    var visionFound = false;
                    for( let creature of this.state.game.creatures) {
                        if (`creature-${creature.id}` == vision.id) {
                            creature.vision = vision;
                            visionFound = true;
                            break;
                        }
                    }

                    // continue if we found some creature already
                    if (visionFound) { continue; }

                    // search tile
                    for( let tile of this.state.map.tiles) {
                        if (`tile-${tile.id}` == vision.id) {
                            tile.vision = vision;
                            break;
                        }
                    }
                }

                // update container
                this.mapComponent.mapContainer.update(this.state);

                // draw vision & lights
                this.mapComponent.mapContainer.lightsLayer.draw();
                this.mapComponent.mapContainer.visionLayer.draw();
                break;
            }

            case WSEventName.messageCreated: {
		    this.state.messages.push(event.data);
		    if (this.messages) {
			    let lastHost = localStorage.getItem("lastSuccessfullHost");
			    localStorage.setItem("readMessages",JSON.stringify({"lastHost": lastHost, seenCount: this.state.messages.length}));
			    this.state.readCount = this.state.messages.length;
		    }
                // this.toastService.showMessage(event.data);
                // this.messageListComponent.scrollToBottom();
                break;
            }
        }
    }

    // get data from JSON API
    getData() {
        this.dataService.getData().subscribe((data: ApiData) => {
            this.state.game = data.game;
            this.state.map = data.map;
            this.state.screen = data.screen;
            this.state.messages = data.messages;
            this.state.version = data.version;
            this.state.build = data.build;

            this.dataService.state = this.state;
        
            if (this.mapComponent != undefined) {
                this.mapComponent.isReady = true;
                this.mapComponent.update();
                this.mapComponent.draw();
            }
            console.debug(this.state);
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

    ngOnInit() {
        // init user color
        let color = localStorage.getItem("userColor");
        if (!color) {
            localStorage.setItem("userColor", '#'+(Math.random()*0xFFFFFF<<0).toString(16));
        }

        // update messages based on local storage settings
        this.messages = (localStorage.getItem("activePanel") || Panel.none) == Panel.messages;

        this.configureRemoteHost();
        this.wsConnect();

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
                this.dataService.send({name: WSEventName.clientUpdated, data: {name: name, color: color}});

                let readMessages = JSON.parse(localStorage.getItem("readMessages"));
                if (readMessages && readMessages.lastHost == this.dataService.remoteHost) {
                    this.state.readCount = readMessages.seenCount;
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
}
