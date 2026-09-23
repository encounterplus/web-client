import { AppState, parseRunMode, parseViewMode, RunMode, ViewMode } from './app-state'
import { minimalCombatant, minimalGame } from './testing/fixtures'

describe('parseViewMode', () => {

    it('reads each known mode', () => {
        expect(parseViewMode("dm")).toBe(ViewMode.dm)
        expect(parseViewMode("player")).toBe(ViewMode.player)
        expect(parseViewMode("spectator")).toBe(ViewMode.spectator)
    })

    it('reads anything else back as undefined, so the caller picks the default', () => {
        expect(parseViewMode(null)).toBeUndefined()
        expect(parseViewMode("")).toBeUndefined()
        expect(parseViewMode("DM")).toBeUndefined()
        expect(parseViewMode("gm")).toBeUndefined()
    })
})

describe('parseRunMode', () => {

    it('reads each known mode', () => {
        expect(parseRunMode("normal")).toBe(RunMode.normal)
        expect(parseRunMode("tv")).toBe(RunMode.tv)
    })

    it('reads anything else back as undefined', () => {
        expect(parseRunMode(null)).toBeUndefined()
        expect(parseRunMode("")).toBeUndefined()
        expect(parseRunMode("TV")).toBeUndefined()
    })
})

describe('AppState', () => {

    it('starts on the player view with an empty game', () => {
        const state = new AppState()
        expect(state.viewMode).toBe(ViewMode.player)
        expect(state.runMode).toBe(RunMode.normal)
        expect(state.game.combatants).toEqual([])
        expect(state.map).toBeUndefined()
        expect(state.messages).toEqual([])
    })

    describe('turned', () => {

        it('finds the combatant whose turn it is', () => {
            const state = new AppState()
            const turned = minimalCombatant({ id: "b" })
            state.game = minimalGame({
                combatantId: "b",
                combatants: [minimalCombatant({ id: "a" }), turned],
            })
            expect(state.turned).toBe(turned)
        })

        it('is null when no combatant matches', () => {
            const state = new AppState()
            state.game = minimalGame({ combatantId: "z", combatants: [minimalCombatant({ id: "a" })] })
            expect(state.turned).toBeNull()
        })

        it('is null when the game has no combatant turned', () => {
            const state = new AppState()
            state.game = minimalGame({ combatants: [minimalCombatant({ id: "a" })] })
            expect(state.turned).toBeNull()
        })

        it('survives a game whose combatants the server left out', () => {
            const state = new AppState()
            state.game = minimalGame({ combatantId: "a" })
            state.game.combatants = undefined as unknown as typeof state.game.combatants
            expect(state.turned).toBeNull()
        })
    })
})
