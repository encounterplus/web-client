import { Component, OnInit, Input } from '@angular/core';
import { Combatant } from 'src/app/shared/models/combatant';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
    selector: 'app-combatant',
    templateUrl: './combatant.component.html',
    styleUrls: ['./combatant.component.scss'],
    standalone: false
})
export class CombatantComponent implements OnInit {

  @Input() 
  public combatant: Combatant;

  get image(): string {
    return this.combatant.image ? `${this.dataService.protocol}//${this.dataService.remoteHost}${this.combatant.image}` : "assets/img/creature.png"
  }

  get name(): string {
    return this.combatant.entityType == "Character" ? this.combatant.name : this.combatant.label;
  }

  get overlayImage(): string {
    if (this.combatant.defeated || false) {
      return "assets/img/creature-dead.png";
    } else if (this.combatant.bloodied || false) {
      return "assets/img/creature-bloodied.png";
    } else {
      return "";
    }
  }

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

}
