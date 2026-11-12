import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { GameResource } from 'src/app/shared/models/game';
import { resolveEffectIcon } from 'src/app/shared/icons/game-icons';
import { DataService } from 'src/app/shared/services/data.service';

/** A resource with its icon resolved to what the template draws. */
interface ResourceItem {
  resource: GameResource
  /** The game icon font glyph, for a `gi-` icon. */
  glyph?: string
  /** The image URL on the server, for an image icon. */
  image?: string
}

/**
 * The player-visible game resources, such as Daggerheart's Fear, as a row across the top of the
 * screen: each value with its label, and its maximum when the resource has one. Read only — the
 * GM changes them in the app.
 */
@Component({
    selector: 'app-resources-bar',
    templateUrl: './resources-bar.component.html',
    styleUrls: ['./resources-bar.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ResourcesBarComponent {

  items: Array<ResourceItem> = []

  @Input()
  set resources(resources: Array<GameResource>) {
    this.items = resources.map(resource => this.item(resource))
  }

  constructor(private dataService: DataService) { }

  private item(resource: GameResource): ResourceItem {
    // no icon draws nothing, rather than the status effects' default glyph
    const icon = resource.icon ? resolveEffectIcon(resource.icon) : null

    switch (icon?.kind) {
      case 'glyph':
        return { resource, glyph: icon.char }
      case 'image':
        return { resource, image: this.dataService.baseURL + icon.src }
      default:
        return { resource }
    }
  }
}
