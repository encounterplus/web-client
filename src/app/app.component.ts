import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService } from './shared/services/data.service';
import { environment } from 'src/environments/environment';
import { AppState } from './shared/models/app-state';
import { Creature } from './shared/models/creature';
import { WSEventName, WSEvent } from './shared/models/wsevent';
import { ControlState } from './core/map/views/token-view';
import { AreaEffect } from './shared/models/area-effect';
import { Tile } from './shared/models/tile';
import { ToolbarComponent } from './core/toolbar/toolbar.component';
import { ToastListComponent } from './core/toast-list/toast-list.component';
import { ToastService } from './shared/toast.service';
import { retry } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsModalComponent } from './core/settings-modal/settings-modal.component';
import { ActivatedRoute } from '@angular/router';
import { Loader } from './core/map/models/loader';
import { AboutModalComponent } from './core/about-modal/about-modal.component';
import { BaseTexture } from 'pixi.js';

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

    @ViewChild(ToolbarComponent)
    public toolbarComponent: ToolbarComponent;

    @ViewChild(ToastListComponent)
    public toastListComponent: ToastListComponent;

    constructor(private dataService: DataService, private toastService: ToastService, private modalService: NgbModal) { 
        this.state = new AppState();

        window['state'] = this.state;
    }

    toolbarAction(type: string) {
        console.log(type);
        switch (type) {
            case "showSettings":
                this.modalService.open(SettingsModalComponent).result.then(result => {
                    console.debug(`Settings component closed with: ${result}`);
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
                // let creature = Object.assign(new Creature, event.data) as Creature;
                
                // this.state.game.creatures.push(creature);

                // udpdate state
                let index =  this.state.game.creatures.findIndex((obj => obj.id == event.data.id));
                let creature = this.state.game.creatures[index];
                // this.state.game.creatures[index] = creature;

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
                }

                this.mapComponent.mapContainer.lightsLayer.update();
                this.mapComponent.mapContainer.visionLayer.update()
                this.mapComponent.mapContainer.visionLayer.draw();
                this.mapComponent.mapContainer.lightsLayer.draw();

                this.mapComponent.mapContainer.aurasLayer.tokens = this.mapComponent.mapContainer.playersLayer.views;
                this.mapComponent.mapContainer.aurasLayer.draw();
                break
            }

            case WSEventName.creatureMoved: {
                let token = this.mapComponent.mapContainer.tokenByCreatureId(event.data.id);
                if (token != null) {
                    token.blocked = event.data.state == ControlState.block;

                    if (!token.dragging) {
                        token.creature.x = event.data.x;
                        token.creature.y = event.data.y;
                        token.controlled = event.data.state != ControlState.end && !token.dragging ? true : false
                        token.update();
                        token.updateTint();
                    }

                    token.distance = event.data.distance;
                    token.updateDistance();

                    if (event.data.path != null) {
                        this.mapComponent.mapContainer.gridLayer.updateHighlight(event.data.path, token.creature.scale, token.color);
                        this.mapComponent.mapContainer.gridLayer.drawHighlight();
                    }

                    if (event.data.state == ControlState.end) {
                        this.mapComponent.mapContainer.gridLayer.updateHighlight([], token.creature.scale, token.color);
                        this.mapComponent.mapContainer.gridLayer.drawHighlight();
                    }
                }

                // this.state.game.creatures[index] = creature;
                if (event.data.los != null) {
                    let index =  this.state.game.creatures.findIndex((obj => obj.id == event.data.id));
                    this.state.game.creatures[index].x = event.data.x;
                    this.state.game.creatures[index].y = event.data.y;
                    this.state.game.creatures[index].vision.x = event.data.x;
                    this.state.game.creatures[index].vision.y = event.data.y;
                    this.state.game.creatures[index].vision.polygon = event.data.los;
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
                if (view != null) {
                    view.tile = model;
                    view.draw();
                }

                if (event.data.los != null) {
                    let index =  this.state.map.tiles.findIndex((obj => obj.id == event.data.id));
                    this.state.map.tiles[index].x = event.data.x;
                    this.state.map.tiles[index].y = event.data.y;
                    this.state.map.tiles[index].vision.x = event.data.x;
                    this.state.map.tiles[index].vision.y = event.data.y;
                    this.state.map.tiles[index].vision.polygon = event.data.los;
                }
                
                this.mapComponent.mapContainer.lightsLayer.draw();
                this.mapComponent.mapContainer.visionLayer.draw();
                break;
            }

            case WSEventName.fogUpdated: {
                let base64image = event.data.image;

                this.mapComponent.mapContainer.fogLayer.fogBase64 = base64image;
                this.mapComponent.mapContainer.fogLayer.drawPartialFog();
                break;
            }

            case WSEventName.mapLoaded: {
                // window.location = window.location;
                this.getData();
                break;
            }

            case WSEventName.interactionUpdated: {
                this.state.screen.interaction = event.data;
                this.mapComponent.mapContainer.updateInteraction();
                break;
            }

            case WSEventName.pointerUpdated: {
                this.mapComponent.mapContainer.particlesLayer.drawPointer(event.data);
                break;
            }

            case WSEventName.drawingsUpdated: {
                this.state.map.drawings = event.data;
                this.mapComponent.mapContainer.drawingsLayer.update();
                this.mapComponent.mapContainer.drawingsLayer.draw()
                break;
            }

            case WSEventName.screenUpdated: {
                this.state.screen = event.data;
                break;
            }
        }
    }

    getData() {
        this.dataService.getData().subscribe((data: ApiData) => {
            // console.log(data);

            this.state.game = data.game;
            this.state.map = data.map;
            this.state.screen = data.screen;

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
        Loader.shared.remoteBaseURL = this.dataService.baseURL;
    }

    ngOnInit() {
        // init user color
        let color = localStorage.getItem("userColor");
        if (!color) {
            localStorage.setItem("userColor", '#'+(Math.random()*0xFFFFFF<<0).toString(16));
        }

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
