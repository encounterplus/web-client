import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { environment } from 'src/environments/environment';
import { MapComponent } from './core/map/map.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    title = 'external-screen';

    public ws: WebSocket;

    @ViewChild("map", {
        static: false
    })

    public map: MapComponent;

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
}
