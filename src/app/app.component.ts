import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService } from './shared/services/data.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit {
    title = 'external-screen';

    data: ApiData

    destroy$: Subject<boolean> = new Subject<boolean>();

    @ViewChild(MapComponent)
    public mapComponent: MapComponent;

    @ViewChild(InitiativeListComponent)
    public initiativeListComponent: InitiativeListComponent;

    constructor(private dataService: DataService) { 
        this.data = new ApiData()
    }
    
    ngOnInit() {

        this.dataService.getData().subscribe((data: ApiData) => {
            console.log(data);
            this.data = data;
        })

        this.dataService.events.subscribe(event => {
            console.log("Event received: " + JSON.stringify(event));
            console.log(`Event name: ${event.name}`)

            if (event.name == "gameUpdate" ) {
                this.data.game.turn = event.data.turn;
                this.initiativeListComponent.scrollToTurned();
            }

            // this.gethData();
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
