import { BrowserModule } from '@angular/platform-browser';
import { NgModule, provideZonelessChangeDetection } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MapComponent } from './core/map/map.component';
import { InitiativeListComponent } from './core/initiative-list/initiative-list.component';
import { CanvasContainerDirective } from './core/map/canvas-container.directive';
import { CombatantComponent } from './core/combatant/combatant.component';
import { DataService } from './shared/services/data.service';
import { ToolbarComponent } from './core/toolbar/toolbar.component';
import { DisableRightClickDirective } from './core/disable-right-click.directive';
import { ToastService } from './shared/services/toast.service';
import { ToastListComponent } from './core/toast-list/toast-list.component';
import { SettingsModalComponent } from './core/settings-modal/settings-modal.component';
import { AboutModalComponent } from './core/about-modal/about-modal.component';
import { ColorPickerModule } from 'ngx-color-picker';
import { ImageHandoutComponent } from './core/image-handout/image-handout.component';
// import { LightboxModule } from 'ngx-lightbox';
import { MessageComponent } from './core/message/message.component';
import { MessageListComponent } from './core/message-list/message-list.component';
import { PausedComponent } from './core/paused/paused.component';
import { ZoombarComponent } from './core/zoombar/zoombar.component';
import { OverlayComponent } from './core/overlay/overlay.component';
import { EntityModalComponent } from './core/entity-modal/entity-modal.component';
import { DraggableDirective } from './draggable.directive';
import { SafePipe } from 'safe-pipe';

@NgModule({ declarations: [
        AppComponent,
        MapComponent,
        ToolbarComponent,
        InitiativeListComponent,
        ToastListComponent,
        SettingsModalComponent,
        CanvasContainerDirective,
        DisableRightClickDirective,
        CombatantComponent,
        AboutModalComponent,
        ImageHandoutComponent,
        MessageComponent,
        MessageListComponent,
        PausedComponent,
        ZoombarComponent,
        OverlayComponent,
        EntityModalComponent,
        DraggableDirective
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        ColorPickerModule,
        SafePipe,
        NgbModule], providers: [ToastService, DataService, provideZonelessChangeDetection(), provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
