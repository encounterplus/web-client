import { Component, OnInit, Input, ElementRef, AfterViewChecked, AfterViewInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { ActiveCombatant, Combatant, Role } from 'src/app/shared/models/combatant';
import { Game } from 'src/app/shared/models/game';
import { Initiative } from 'src/app/shared/models/initiative';
// import { Lightbox, IAlbum } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';
import { LightboxService } from '../lightbox/lightbox.service';

@Component({
    selector: 'app-initiative-list',
    templateUrl: './initiative-list.component.html',
    styleUrls: ['./initiative-list.component.scss'],
    standalone: false
})
export class InitiativeListComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  static el: HTMLElement;

  // @Input()
  // public game: Game;

  @Input()
  public initiativeId?: string;

  @Input()
  activeCombatants: Array<ActiveCombatant> = []

  constructor(private element: ElementRef, private lightboxService: LightboxService, private dataService: DataService) {
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    // console.debug("initiative-list component checked");
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

  scrollToTurned(turnedId?: string) {
    // scroll to turned element
    const initiativeId = turnedId || this.initiativeId
    console.debug(initiativeId);
    const selector = `[data-id="${initiativeId}"]`;
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

  private getImage(index: number): string {
    return this.activeCombatants[index].combatant.image ? `${this.dataService.protocol}//${this.dataService.remoteHost}${this.activeCombatants[index].combatant.image}` : "assets/img/creature.png"
  }

  open(index: number): void {
    this.lightboxService.open(this.getImage(index), this.activeCombatants[index].combatant.name);
  }

  close(): void {
    this.lightboxService.close();
  }
}
