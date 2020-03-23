import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService } from './shared/services/data.service';
import { environment } from 'src/environments/environment';
import { AppState } from './shared/models/app-state';

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

    constructor(private dataService: DataService) { 
        this.state = new AppState();
    }

    ngOnInit() {

        this.dataService.getData().subscribe((data: ApiData) => {
            // console.log(data);

            this.state.game = data.game;
            this.state.map = data.map;
            this.state.config = data.config;

            console.debug(this.state);
        })

        this.dataService.events.subscribe(event => {
            console.log("Event received: " + JSON.stringify(event));
            console.log(`Event name: ${event.name}`)

            if (event.name == "gameUpdate" ) {
                this.state.game.turn = event.data.turn;
                this.initiativeListComponent.scrollToTurned();
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
