import { minimalStatusEffect } from 'src/app/shared/models/testing/fixtures'
import { MAX_STATUS_EFFECTS, StatusEffectsView, statusEffectFrames, statusEffectTint, visibleStatusEffects } from './status-effects-view'

describe('statusEffectFrames', () => {

    it('sizes cells to a quarter of the token', () => {
        expect(statusEffectFrames(1, 100, 100)).toEqual([{ x: 0, y: 0, size: 25 }])
    })

    it('fills two rows column by column, as the app does', () => {
        const frames = statusEffectFrames(5, 100, 100)
        expect(frames.map(frame => [frame.x, frame.y])).toEqual([[0, 0], [0, 25], [25, 0], [25, 25], [50, 0]])
    })

    it('stops at the cap', () => {
        const frames = statusEffectFrames(17, 100, 100)
        expect(frames.length).toBe(MAX_STATUS_EFFECTS)
        expect(frames[MAX_STATUS_EFFECTS - 1]).toEqual({ x: 175, y: 25, size: 25 })
    })

    it('sizes from the shorter side', () => {
        expect(statusEffectFrames(1, 300, 200)[0].size).toBe(50)
    })

    it('has no cells for no effects', () => {
        expect(statusEffectFrames(0, 100, 100)).toEqual([])
    })
})

describe('visibleStatusEffects', () => {

    it('keeps enabled and unset effects, drops disabled ones', () => {
        const effects = [minimalStatusEffect({ id: "a" }), minimalStatusEffect({ id: "b", enabled: false }), minimalStatusEffect({ id: "c", enabled: true })]
        expect(visibleStatusEffects(effects).map(effect => effect.id)).toEqual(["a", "c"])
    })

    it('caps the count', () => {
        const effects = Array.from({ length: 20 }, (_, i) => minimalStatusEffect({ id: `${i}` }))
        expect(visibleStatusEffects(effects).length).toBe(MAX_STATUS_EFFECTS)
    })

    it('handles a combatant without effects', () => {
        expect(visibleStatusEffects(undefined)).toEqual([])
    })
})

describe('statusEffectTint', () => {

    it('reads the effect colour', () => {
        expect(statusEffectTint("#ff8800")).toBe(0xff8800)
        expect(statusEffectTint("FF8800")).toBe(0xff8800)
    })

    it('is white without a colour or with one that does not parse', () => {
        expect(statusEffectTint(undefined)).toBe(0xffffff)
        expect(statusEffectTint("")).toBe(0xffffff)
        expect(statusEffectTint("not a colour")).toBe(0xffffff)
    })
})

describe('StatusEffectsView', () => {

    it('draws a cell per visible effect', async () => {
        const view = new StatusEffectsView()
        await view.draw([minimalStatusEffect({ id: "a" }), minimalStatusEffect({ id: "b" })], 100, 100)
        expect(view.children.length).toBe(2)
        expect(view.children[1].position.x).toBe(0)
        expect(view.children[1].position.y).toBe(25)
        view.destroy({ children: true })
    })

    it('keeps its cells when nothing changed', async () => {
        const view = new StatusEffectsView()
        const effects = [minimalStatusEffect({ id: "a", color: "#ff0000" })]
        await view.draw(effects, 100, 100)
        const cell = view.children[0]
        await view.draw([...effects], 100, 100)
        expect(view.children[0]).toBe(cell)
        view.destroy({ children: true })
    })

    it('rebuilds when an effect changes colour or the token resizes', async () => {
        const view = new StatusEffectsView()
        await view.draw([minimalStatusEffect({ id: "a", color: "#ff0000" })], 100, 100)
        const cell = view.children[0]
        await view.draw([minimalStatusEffect({ id: "a", color: "#00ff00" })], 100, 100)
        expect(view.children[0]).not.toBe(cell)
        const recoloured = view.children[0]
        await view.draw([minimalStatusEffect({ id: "a", color: "#00ff00" })], 200, 200)
        expect(view.children[0]).not.toBe(recoloured)
        view.destroy({ children: true })
    })

    it('keeps only the latest of two overlapping draws', async () => {
        const view = new StatusEffectsView()
        const first = view.draw([minimalStatusEffect({ id: "a" }), minimalStatusEffect({ id: "b" })], 100, 100)
        const second = view.draw([minimalStatusEffect({ id: "c" })], 100, 100)
        await Promise.all([first, second])
        expect(view.children.length).toBe(1)
        view.destroy({ children: true })
    })

    it('empties when the effects go away', async () => {
        const view = new StatusEffectsView()
        await view.draw([minimalStatusEffect()], 100, 100)
        await view.draw([], 100, 100)
        expect(view.children.length).toBe(0)
        view.destroy({ children: true })
    })
})
