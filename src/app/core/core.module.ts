import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapComponent } from './map/map.component';
import { InitiativeListComponent } from './initiative-list/initiative-list.component';



@NgModule({
  declarations: [MapComponent, InitiativeListComponent],
  imports: [
    CommonModule
  ]
})
export class CoreModule { }
