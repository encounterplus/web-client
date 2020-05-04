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
import { WebsocketService } from './shared/services/websocket.service';
import { ApiService } from './shared/services/api.service';
import { retry } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsModalComponent } from './core/settings-modal/settings-modal.component';

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

    constructor(private dataService: DataService, private websocketService: WebsocketService, private apiService: ApiService, private ts: ToastService, private modalService: NgbModal) { 
        this.state = new AppState();
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
        }
    }

    handleEvent(event: WSEvent) {
        if (event.name == WSEventName.gameUpdate ) {
            this.state.game.turn = event.data.turn;
            this.initiativeListComponent.scrollToTurned();
            this.mapComponent.mapContainer.updateTurned(this.state.turned);
        } else if (event.name == "creatureUpdate") {
            let creature = Object.assign(new Creature, event.data) as Creature;
            console.debug(creature);
            // this.state.game.creatures.push(creature);

            // udpdate state
            let index =  this.state.game.creatures.findIndex((obj => obj.id == creature.id));
            // this.state.game.creatures[index] = creature;
            this.state.game.creatures[index].vision = creature.vision;

            // update token
            let token = this.mapComponent.mapContainer.tokenByCreatureId(creature.id)
            if (token != null) {
                token.creature = creature;
                token.creature.x = event.data.x;
                token.creature.y = event.data.y;
                token.update();
                token.updateTint();
            }

            this.mapComponent.mapContainer.visionLayer.draw();

            // this.mapComponent.mapContainer.tokensLayer.updateCreatures(this.state.mapCreatures);
            // this.mapComponent.mapContainer.tokensLayer.draw()
        } else if (event.name == WSEventName.creatureMove) {

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
            // this.mapComponent.mapContainer.tokensLayer.updateCreatures(this.state.mapCreatures);
            // this.mapComponent.mapContainer.tokensLayer.draw()
        } else if (event.name == WSEventName.areaEffectUpdate) {
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
        } else if (event.name == WSEventName.tileUpdate) {
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
        }
    }

    getData() {
        this.apiService.getData().subscribe((data: ApiData) => {
            // console.log(data);

            this.state.game = data.game;
            this.state.map = data.map;
            this.state.config = data.config;

            if (this.mapComponent != undefined) {
                this.mapComponent.isReady = true;
                this.mapComponent.update();
                this.mapComponent.draw();
            }

            console.debug(this.state);
        }, err => this.ts.showError("API error: " + err));
    }

    wsConnect() {
        this.websocketService.events$.subscribe(event => {
            // console.log("Event received: " + JSON.stringify(event));
            console.log(`Event received: ${event.name}`)
            this.handleEvent(event);
        }, err => this.ts.showError("Websocket error: " + err), () => this.ts.showSuccess("Websocket connected"));

        this.websocketService.connectionStatus$.subscribe(status => {
            if (status) {
                this.ts.clear();
                this.ts.showSuccess("Websocket connected");
                this.getData();
            } else {
                this.ts.showError("Websocket disconnected", false);
            }
        });
    }

    ngOnInit() {

        // this.getData();
        this.wsConnect();
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        // Unsubscribe from the subject
        this.destroy$.unsubscribe();
      }
}
