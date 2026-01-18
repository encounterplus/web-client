import { Component, OnInit, Input, ElementRef, AfterViewChecked, AfterViewInit, OnDestroy } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Combatant, Role } from 'src/app/shared/models/combatant';
import { Initiative } from 'src/app/shared/models/initiative';
// import { Lightbox, IAlbum } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';

interface ActiveCombatant {
  initiative: Initiative,
  combatant: Combatant
}

@Component({
    selector: 'app-initiative-list',
    templateUrl: './initiative-list.component.html',
    styleUrls: ['./initiative-list.component.scss'],
    standalone: false
})
export class InitiativeListComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  static el: HTMLElement;

  @Input()
  public state: AppState;

  constructor(private element: ElementRef, /*private lightbox: Lightbox,*/ private dataService: DataService) {
  }

  get activeCombatants(): Array<ActiveCombatant> {
    var array = Array<ActiveCombatant>()

    for (let combatant of this.state.game.combatants.filter(combatant => combatant.initiative && (combatant.role != Role.hostile || !combatant.hidden))) {
      for (let initiative of combatant.initiative ?? []) {
        if (initiative.order) {
          array.push({initiative: initiative, combatant: combatant})
        }
      }
    }

    return array.sort((a, b) => (a.initiative.order > b.initiative.order) ? 1 : -1);
  }

  // get images(): Array<IAlbum> {
  //   const images: Array<IAlbum> = [];
  //   for (const creature of this.activeCreatures) {
  //     images.push({ src: `${this.dataService.protocol}//${this.dataService.remoteHost}${creature.image}`, caption: null, thumb: null });
  //   }
  //   return images;
  // }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    // console.debug("view checked");
  }

  ngAfterViewInit(): void {
    InitiativeListComponent.el = this.element.nativeElement;
    this.scrollToTurned();
    window.dispatchEvent(new Event('resize'));
  }

  ngOnDestroy(): void {
    InitiativeListComponent.el = undefined;
    window.dispatchEvent(new Event('resize'));
  }

  scrollToTurned() {
    // scroll to turned element
    // console.debug(this.state.turnedId);
    const selector = `[data-id="${this.state.game.initiativeId}"]`;
    const el = InitiativeListComponent.el.querySelector(selector);
    if (el) {
      const box = el.getBoundingClientRect();

      if (box.top < 0 || box.bottom > window.innerHeight) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: box.top < 0 ? 'start' : 'end',
          inline: 'nearest',
        });
      }
    }
  }

  open(index: number): void {
    // empty image check
    // if (this.activeCombatants[index].image == null) {
    //   return;
    // }
    // open lightbox
    // this.lightbox.open(this.images, index);
  }

  close(): void {
    // close lightbox programmatically
    // this.lightbox.close();
  }
}
