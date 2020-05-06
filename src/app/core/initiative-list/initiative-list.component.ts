import { Component, OnInit, Input, ElementRef, IterableDiffers } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Creature } from 'src/app/shared/models/creature';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit {

  @Input() 
  public state: AppState;

  constructor(private element: ElementRef) { 
  }

  get activeCreatures(): Array<Creature> {
    return this.state.game.creatures.filter( creature => { return creature.initiative != -10 } ).sort((a, b) => (a.rank > b.rank) ? 1 : -1)
}

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    // console.debug("view checked");
  }

  ngAfterViewInit(): void {
    this.scrollToTurned();
  }

  scrollToTurned() {
    // scroll to turned element
    console.debug(this.state.turnedId);
    let selector = `[data-id="${this.state.turnedId}"]`;
    let el = this.element.nativeElement.querySelector(selector);
    if (el) {
      el.scrollIntoView();
    }
  }
}
