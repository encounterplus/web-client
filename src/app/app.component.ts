import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { MapComponent } from './core/map/map.component';
import { Subject } from 'rxjs';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { ApiData } from './shared/models/api-data';
import { DataService } from './shared/services/data.service';
import { environment } from 'src/environments/environment';
import { AppState } from './shared/models/app-state';
import { Creature } from './shared/models/creature';

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
            // console.log("Event received: " + JSON.stringify(event));
            console.log(`Event name: ${event.name}`)

            if (event.name == "gameUpdate" ) {
                this.state.game.turn = event.data.turn;
                this.initiativeListComponent.scrollToTurned();
                this.mapComponent.mapContainer.tokensLayer.updateTurned(this.state.turned);
            } else if (event.name == "creatureUpdate") {
                let creature = Object.assign(new Creature, event.data) as Creature;
                console.debug(creature);
                // this.state.game.creatures.push(creature);

                // udpdate state
                let index =  this.state.game.creatures.findIndex((obj => obj.id == creature.id));
                // this.state.game.creatures[index] = creature;
                this.state.game.creatures[index].vision = creature.vision;

                // update token
                let token = this.mapComponent.mapContainer.tokensLayer.tokenByCreatureId(creature.id)
                if (token != null) {
                    token.creature = creature;
                    token.creature.x = event.data.x;
                    token.creature.y = event.data.y;
                    token.update();
                }

                this.mapComponent.mapContainer.visionLayer.draw();

                // this.mapComponent.mapContainer.tokensLayer.updateCreatures(this.state.mapCreatures);
                // this.mapComponent.mapContainer.tokensLayer.draw()
            } else if (event.name == "creatureMove") {

                let token = this.mapComponent.mapContainer.tokensLayer.tokenByCreatureId(event.data.id);
                if (token != null) {
                    token.creature.x = event.data.x;
                    token.creature.y = event.data.y;
                    token.update();
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
                
                
                this.mapComponent.mapContainer.visionLayer.draw();
                // this.mapComponent.mapContainer.tokensLayer.updateCreatures(this.state.mapCreatures);
                // this.mapComponent.mapContainer.tokensLayer.draw()
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
