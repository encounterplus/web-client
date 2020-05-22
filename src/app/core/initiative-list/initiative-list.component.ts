import { Component, OnInit, Input, ElementRef, IterableDiffers } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Creature } from 'src/app/shared/models/creature';
import { Lightbox, IAlbum } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit {
  // Used to store how much space it's current taking up.
  static WIDTH = 0;

  @Input()
  public state: AppState;

  constructor(private element: ElementRef, private lightbox: Lightbox, private dataService: DataService) {
  }

  get activeCreatures(): Array<Creature> {
    return this.state.game.creatures.filter(creature => { return creature.initiative != -10 }).sort((a, b) => (a.rank > b.rank) ? 1 : -1)
  }

  get images(): Array<IAlbum> {
    let images: Array<IAlbum> = [];
    for (let creature of this.activeCreatures) {
      images.push({ src: `http://${this.dataService.remoteHost}${creature.image}`, caption: null, thumb: null });
    }
    return images;
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
    const selector = `[data-id="${this.state.turnedId}"]`;
    const el = (this.element.nativeElement as HTMLElement).querySelector(selector);
    if (el) {
      const box = el.getBoundingClientRect();

      if (box.top < 0 || box.bottom > window.innerHeight) {
        el.scrollIntoView(box.top < 0);
      }
    }
  }

  open(index: number): void {
    // open lightbox
    this.lightbox.open(this.images, index);
    InitiativeListComponent.WIDTH = 150;
  }

  close(): void {
    // close lightbox programmatically
    this.lightbox.close();
    InitiativeListComponent.WIDTH = 0;
  }
}
