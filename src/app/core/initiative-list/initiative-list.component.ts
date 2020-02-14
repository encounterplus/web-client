import { Component, OnInit, Input } from '@angular/core';
import { ApiData } from 'src/app/shared/models/api-data';
import { Game } from 'src/app/shared/models/game';
import { Creature } from 'src/app/shared/models/creature';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit {

  @Input() 
  public game: Game;

  get activeCreatures(): Array<Creature> {
    return this.game.creatures.sort((a, b) => (a.rank > b.rank) ? 1 : -1)
  }

  get turned(): Creature {
      return (this.game.creatures.length > 0 && this.game.creatures.length >= this.game.turn ) ? this.activeCreatures[this.game.turn - 1] : null
  }

  get turnedId(): string {
      return this.turned != null && this.turned.id != null ? this.turned.id : "";
  }

  constructor() { }

  ngOnInit(): void {
  }

}
