import { Component, Input, Output, EventEmitter, ElementRef, AfterViewChecked, AfterViewInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActiveCombatant } from 'src/app/shared/models/combatant';
// import { Lightbox, IAlbum } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';
import { LightboxService } from '../lightbox/lightbox.service';
import {
  InitiativeDockPosition,
  nextInitiativeDockPosition,
  saveInitiativeDock,
  storedInitiativeDockPosition,
} from './initiative-dock';

@Component({
    selector: 'app-initiative-list',
    templateUrl: './initiative-list.component.html',
    styleUrls: ['./initiative-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class InitiativeListComponent implements OnDestroy, AfterViewChecked, AfterViewInit {
  static el: HTMLElement | undefined;

  // @Input()
  // public game: Game;

  @Input()
  public initiativeId?: string;

  @Input()
  activeCombatants: Array<ActiveCombatant> = []

  @Input()
  messagesOpen = false;

  @Output()
  dockPositionChange = new EventEmitter<InitiativeDockPosition>();

  dockPosition: InitiativeDockPosition = storedInitiativeDockPosition();

  constructor(private element: ElementRef, private lightboxService: LightboxService, private dataService: DataService) {
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
    const host = InitiativeListComponent.el
    if (host == null) {
      return
    }

    // scroll to turned element
    const initiativeId = turnedId || this.initiativeId
    console.debug(initiativeId);
    const selector = `[data-id="${initiativeId}"]`;
    const el = host.querySelector(selector);
    const viewport = host.querySelector('.initiative-entries');
    if (el && viewport) {
      const box = el.getBoundingClientRect();
      const hostBox = viewport.getBoundingClientRect();

      if (box.top < hostBox.top || box.bottom > hostBox.bottom || box.left < hostBox.left || box.right > hostBox.right) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }

  toggleDockPosition(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.dockPosition = nextInitiativeDockPosition(this.dockPosition);
    saveInitiativeDock(this.dockPosition);
    this.dockPositionChange.emit(this.dockPosition);
    window.dispatchEvent(new Event('resize'));
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
