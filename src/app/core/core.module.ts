import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map/map.component';
import { InitiativeListComponent } from './initiative-list/initiative-list.component';
import { CanvasContainerDirective } from './map/canvas-container.directive';

@NgModule({
  declarations: [MapComponent, InitiativeListComponent, CanvasContainerDirective],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
