import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MapComponent } from './core/map/map.component';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { CanvasContainerDirective } from './core/map/canvas-container.directive';
import { CreatureComponent } from './core/creature/creature.component';
import { ApiService } from './shared/services/api.service';
import { WebsocketService } from './shared/services/websocket.service';
import { DataService } from './shared/services/data.service';
import { ToolbarComponent } from './core/toolbar/toolbar.component';
import { DisableRightClickDirective } from './core/disable-right-click.directive';
import { ToastService } from './shared/toast.service';
import { ToastListComponent } from './core/toast-list/toast-list.component';
import { SettingsModalComponent } from './core/settings-modal/settings-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    MapComponent,
    ToolbarComponent,
    InitiativeListComponent,
    ToastListComponent,
    SettingsModalComponent,
    CanvasContainerDirective,
    DisableRightClickDirective,
    CreatureComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    NgbModule
  ],
  providers: [ToastService, ApiService, WebsocketService, DataService],
  bootstrap: [AppComponent]
})
export class AppModule { }
