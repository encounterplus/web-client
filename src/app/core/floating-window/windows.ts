import { CharacterRow } from 'src/app/shared/models/character';
import { IframeContentComponent } from './iframe-content.component';
import { SHEET_SIZE, WindowSize, WindowSpec, WindowState } from './floating-window.service';

/** A stat block's: one narrow column, as the app shows it. */
export const STAT_BLOCK_SIZE: WindowSize = { width: 420, height: 900 }

const CHARACTER = 'character:'
const ENTITY = 'entity:'

export function characterWindowKey(characterId: string): string {
  return CHARACTER + characterId
}

/** A character's sheet, or its view, in a window: one per character. */
export function characterWindow(character: CharacterRow & { url: string }): WindowSpec {
  return pageWindow(characterWindowKey(character.id), character.name, character.url, SHEET_SIZE)
}

/**
 * An entity's page, such as a token's stat block, in a window: one per entity, whichever token
 * opened it. Narrow like a stat block unless given a size, such as a sheet's for a character.
 */
export function entityWindow(reference: string, title: string, url: string, size: WindowSize = STAT_BLOCK_SIZE): WindowSpec {
  return pageWindow(ENTITY + reference, title, url, size)
}

/** The character a window shows, if it is a character's. */
export function windowCharacterId(window: WindowState): string | undefined {
  return window.key.startsWith(CHARACTER) ? window.key.slice(CHARACTER.length) : undefined
}

/** The entity reference a window shows, if it is an entity's. */
export function windowEntityReference(window: WindowState): string | undefined {
  return window.key.startsWith(ENTITY) ? window.key.slice(ENTITY.length) : undefined
}

/** The address a window's page is loaded from, if it shows one. */
export function windowUrl(window: WindowState): string | undefined {
  return window.component == IframeContentComponent ? window.inputs?.['url'] as string : undefined
}

function pageWindow(key: string, title: string, url: string, size: WindowSize): WindowSpec {
  return { key, title, component: IframeContentComponent, inputs: { url, title }, externalUrl: url, size }
}
