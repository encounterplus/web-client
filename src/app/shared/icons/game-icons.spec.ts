import gameIcons from './game-icons.json'
import { DEFAULT_GAME_ICON, EffectIcon, resolveEffectIcon } from './game-icons'

const glyphs: { [name: string]: string } = gameIcons

describe('resolveEffectIcon', () => {

    it('draws a gi- name as its glyph', () => {
        expect(resolveEffectIcon("gi-abacus")).toEqual({ kind: 'glyph', char: glyphs["gi-abacus"] })
    })

    it('reads a gi- name that arrives with a leading slash', () => {
        expect(resolveEffectIcon("/gi-abacus")).toEqual({ kind: 'glyph', char: glyphs["gi-abacus"] })
    })

    it('falls back to the default glyph for an unknown name', () => {
        expect(resolveEffectIcon("gi-not-an-icon")).toEqual({ kind: 'glyph', char: glyphs[DEFAULT_GAME_ICON] })
    })

    it('draws an image path as a tinted image', () => {
        expect(resolveEffectIcon("/systems/dnd5e/icons/poisoned.png")).toEqual({ kind: 'image', src: "/systems/dnd5e/icons/poisoned.png", tinted: true })
    })

    it('roots a relative image path', () => {
        expect(resolveEffectIcon("systems/dnd5e/icons/poisoned.WEBP")).toEqual({ kind: 'image', src: "/systems/dnd5e/icons/poisoned.WEBP", tinted: true })
    })

    it('leaves an image untinted when its path says no-tint', () => {
        expect(resolveEffectIcon("/systems/dnd5e/icons/no-tint/blessed.png")).toEqual({ kind: 'image', src: "/systems/dnd5e/icons/no-tint/blessed.png", tinted: false })
        expect(resolveEffectIcon("/modules/x/blessed-no-tint.png")).toEqual({ kind: 'image', src: "/modules/x/blessed-no-tint.png", tinted: false })
    })

    it('draws the default glyph for an effect without an icon', () => {
        const fallback: EffectIcon = { kind: 'glyph', char: glyphs[DEFAULT_GAME_ICON] }
        expect(resolveEffectIcon(undefined)).toEqual(fallback)
        expect(resolveEffectIcon(null)).toEqual(fallback)
        expect(resolveEffectIcon("")).toEqual(fallback)
        expect(resolveEffectIcon("  ")).toEqual(fallback)
    })

    it('draws nothing for an unrecognised icon', () => {
        expect(resolveEffectIcon("poisoned")).toBeNull()
        expect(resolveEffectIcon("/systems/dnd5e/icons/poisoned.svg")).toBeNull()
    })

    it('knows the default glyph', () => {
        expect(glyphs[DEFAULT_GAME_ICON]).toBeTruthy()
    })
})
