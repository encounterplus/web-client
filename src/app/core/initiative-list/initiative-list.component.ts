import { Component, OnInit, Input, ElementRef, AfterViewChecked, AfterViewInit, OnDestroy } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Creature, Role } from 'src/app/shared/models/creature';
import { Lightbox, IAlbum } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  static el: HTMLElement;

  @Input()
  public state: AppState;

  constructor(private element: ElementRef, private lightbox: Lightbox, private dataService: DataService) {
  }

  get activeCreatures(): Array<Creature> {
    return this.state.game.creatures.filter(creature => creature.initiative !== -10 && (creature.role != Role.hostile || !creature.hidden)).sort((a, b) => (a.rank > b.rank) ? 1 : -1);
  }

  get images(): Array<IAlbum> {
    const images: Array<IAlbum> = [];
    for (const creature of this.activeCreatures) {
      images.push({ src: `${this.dataService.protocol}//${this.dataService.remoteHost}${creature.image}`, caption: null, thumb: null });
    }
    return images;
  }

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
    const selector = `[data-id="${this.state.turnedId}"]`;
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
    if (this.activeCreatures[index].image == null) {
      return;
    }
    // open lightbox
    this.lightbox.open(this.images, index);
  }

  close(): void {
    // close lightbox programmatically
    this.lightbox.close();
  }
}
