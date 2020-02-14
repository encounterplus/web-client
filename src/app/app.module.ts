import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MapComponent } from './core/map/map.component';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { CanvasContainerDirective } from './core/map/canvas-container.directive';
import { CreatureComponent } from './core/creature/creature.component';
import { DataService } from './data.service';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    InitiativeListComponent,
    CanvasContainerDirective,
    CreatureComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NgbModule
  ],
  providers: [DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
