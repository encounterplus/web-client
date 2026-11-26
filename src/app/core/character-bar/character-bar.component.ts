import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CharacterRow, characterRow } from 'src/app/shared/models/character';
import { DataService } from 'src/app/shared/services/data.service';
import { SessionService } from 'src/app/shared/services/session.service';
import { FloatingWindowService } from '../floating-window/floating-window.service';
import { characterWindow, characterWindowKey } from '../floating-window/windows';

/**
 * A signed-in player's characters down the left side, each opening its sheet in a floating window.
 * A character with no sheet or view to open shows, dimmed.
 */
@Component({
  selector: 'app-character-bar',
  templateUrl: './character-bar.component.html',
  styleUrls: ['./character-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class CharacterBarComponent {

  constructor(private session: SessionService, private dataService: DataService, private windows: FloatingWindowService) {}

  /** Only a player's: the GM, guests and API keys play no character. */
  get characters(): CharacterRow[] {
    const session = this.session.session()
    if (session?.role != 'player') {
      return []
    }
    return (session.characters ?? []).map(character => characterRow(character, this.dataService))
  }

  /** The ring around every portrait: the player's colour, when the app gave one. */
  get color(): string | undefined {
    return this.session.session()?.player?.color
  }

  isOpen(character: CharacterRow): boolean {
    return this.windows.isOpen(characterWindowKey(character.id))
  }

  /** Opens the character's sheet; brings it forward when it is behind; closes it when it is in front. */
  toggle(character: CharacterRow) {
    const url = character.url
    if (!url) {
      return
    }
    const key = characterWindowKey(character.id)
    if (!this.windows.isOpen(key)) {
      this.windows.open(characterWindow({ ...character, url }))
    } else if (this.windows.front() != key) {
      this.windows.focus(key)
    } else {
      this.windows.close(key)
    }
  }
}
