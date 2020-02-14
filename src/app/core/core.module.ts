import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map/map.component';
import { InitiativeListComponent } from './initiative-list/initiative-list.component';
import { CanvasContainerDirective } from './map/canvas-container.directive';
import { CreatureComponent } from './creature/creature.component';

@NgModule({
  declarations: [MapComponent, InitiativeListComponent, CanvasContainerDirective, CreatureComponent],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
