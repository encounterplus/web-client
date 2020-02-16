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
    return this.creature.image ? `${this.dataService.baseURL}${this.creature.image}` : "/assets/img/creature.png"
  }

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

}
