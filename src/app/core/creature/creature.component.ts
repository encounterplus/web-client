import { Component, OnInit, Input } from '@angular/core';
import { Creature } from 'src/app/shared/models/creature';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-creature',
  templateUrl: './creature.component.html',
  styleUrls: ['./creature.component.scss']
})
export class CreatureComponent implements OnInit {

  @Input() 
  public creature: Creature;

  get image(): string {
    return this.creature.image ? `${this.dataService.protocol}//${this.dataService.remoteHost}${this.creature.image}` : "/assets/img/creature.png"
  }

  get name(): string {
    return this.creature.type == "player" ? this.creature.name : this.creature.uid;
  }

  get overlayImage(): string {
    if (this.creature.dead) {
      return "/assets/img/dead.png";
    } else if (this.creature.bloodied) {
      return "/assets/img/bloodied.png";
    } else {
      return "";
    }
  }

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

}
