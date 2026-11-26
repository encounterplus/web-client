import { resolveEffectIcon } from '../icons/game-icons'
import { SessionCharacter } from '../services/session.service'

/** A signed-in player's character as the client draws it: a portrait, else the icon, else an initial. */
export interface CharacterRow {
  id: string
  name: string
  detail?: string
  /** The portrait, on the server. */
  image?: string
  /** The game icon font glyph, for a `gi-` icon and no portrait. */
  glyph?: string
  /** What draws without either: the name's first letter. */
  initial: string
  /** Where a browser opens the character, its sheet or its view; absent when it has neither. */
  url?: string
}

/** What resolving a character's addresses needs from `DataService`. */
export interface PageAddresses {
  baseURL: string
  pageUrl(path: string): string
}

export function characterRow(character: SessionCharacter, addresses: PageAddresses): CharacterRow {
  const icon = !character.image && character.icon ? resolveEffectIcon(character.icon) : null
  return {
    id: character.id,
    name: character.name,
    detail: character.detail,
    image: character.image ? addresses.baseURL + character.image : icon?.kind == 'image' ? addresses.baseURL + icon.src : undefined,
    glyph: icon?.kind == 'glyph' ? icon.char : undefined,
    initial: (character.name.trim()[0] ?? '?').toUpperCase(),
    url: character.url ? addresses.pageUrl(character.url) : undefined,
  }
}
