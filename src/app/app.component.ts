import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MapComponent } from './core/map/map.component';
import { DataService } from './data.service';
import {  takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    title = 'external-screen';

    data = {}

    destroy$: Subject<boolean> = new Subject<boolean>();

    public ws: WebSocket;

    @ViewChild("appMap", {
        static: false
    })
    public map: MapComponent;

    @ViewChild("appInitiativeList", {
        static: false
    })
    public initiativeList: InitiativeListComponent;

    constructor(private dataService: DataService) { }

    connect(url: string) {
        this.openWebSocketConnection(url);
    }

    private openWebSocketConnection(url: string) {
        console.debug(`Starting a WebSocket connection ${url}`);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.debug(`WebSocket connection opened...`);
            localStorage.setItem("lastSuccessfullWSConnection", url);
        }

        this.ws.onmessage = message => {
            console.debug(`ws message received:`, message);
        }

        this.ws.onerror = error => {
            console.error(`WS Error message: `, error);
            this.ws = null;
        }

        this.ws.onclose = () => {
            this.ws = null;
        }
    }

    disconnect() {
        console.debug(`Disconnecting from WebSockets server`);
        this.ws.close();
        this.ws = null;
    }

    ngOnInit() {

        this.dataService.sendGetRequest().pipe(takeUntil(this.destroy$)).subscribe((data: any[]) => {
            console.log(data);
            this.data = data;
        })

        let lastSuccessfullWSConnection = localStorage.getItem("lastSuccessfullWSConnection");
        var autoReconnect = JSON.parse(localStorage.getItem("autoReconnect"));
        if (autoReconnect == null) {
            autoReconnect = environment.config.defaults.AUTO_RECONNECT
        }
        console.debug(`autoReconnect in app component ngOnInit(): ${autoReconnect}`)

        if (!lastSuccessfullWSConnection) {
            console.debug(`No past successfull WebSocket connections found`)
        } else {
            console.debug(`Last successfull connection string: "${lastSuccessfullWSConnection}"`)
            if (autoReconnect) {
                console.debug(`Set to auto-reconnect. Reconnecting...`)
                this.openWebSocketConnection(lastSuccessfullWSConnection)
            }
        }
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
        this.destroy$.next(true);
        // Unsubscribe from the subject
        this.destroy$.unsubscribe();
      }
}
