import { Component, OnInit, Input } from '@angular/core';
import { Combatant } from 'src/app/shared/models/combatant';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-combatant',
  templateUrl: './combatant.component.html',
  styleUrls: ['./combatant.component.scss']
})
export class CombatantComponent implements OnInit {

  @Input() 
  public creature: Combatant;

  get image(): string {
    return this.creature.image ? `${this.dataService.protocol}//${this.dataService.remoteHost}${this.creature.image}` : "assets/img/creature.png"
  }

  get name(): string {
    return this.creature.player ? this.creature.name : this.creature.uid;
  }

  get overlayImage(): string {
    if (this.creature.dead) {
      return "assets/img/creature-dead.png";
    } else if (this.creature.bloodied) {
      return "assets/img/creature-bloodied.png";
    } else {
      return "";
    }
  }

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

}
