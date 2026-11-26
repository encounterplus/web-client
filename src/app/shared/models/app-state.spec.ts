import { AppState, parseRunMode, parseViewMode, RunMode, tokenControl, ViewMode } from './app-state'
import { minimalCombatant, minimalGame, minimalMap, minimalToken } from './testing/fixtures'

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

describe('token control', () => {

    const hero = minimalToken({ id: "hero-token", entityId: "hero" })
    const rogue = minimalToken({ id: "rogue-token", entityId: "rogue" })
    const wolf = minimalToken({ id: "wolf-token", entityId: "wolf", controlledBy: "p1" })
    const cart = minimalToken({ id: "cart-token", controlledBy: "all" })
    const borrowed = minimalToken({ id: "borrowed-token", entityId: "hero", controlledBy: "p2" })

    function playerState(): AppState {
        const state = new AppState()
        state.map = minimalMap({ tokens: [hero, rogue, wolf, cart, borrowed] })
        state.tokenControl = { playerId: "p1", characterIds: ["hero"] }
        return state
    }

    it('comes only from a signed-in player\'s session', () => {
        expect(tokenControl({ role: 'player', player: { id: "p1" }, characters: [{ id: "hero" }] })).toEqual({ playerId: "p1", characterIds: ["hero"] })
        expect(tokenControl({ role: 'player', player: { id: "p1" } })).toEqual({ playerId: "p1", characterIds: [] })
        expect(tokenControl({ role: 'gm' })).toBeUndefined()
        expect(tokenControl({ role: 'guest' })).toBeUndefined()
        expect(tokenControl(null)).toBeUndefined()
    })

    it('gives a player their characters\' tokens and those the GM gave them or everyone', () => {
        const state = playerState()
        expect(state.controls(hero)).toBeTrue()
        expect(state.controls(rogue)).toBeFalse()
        expect(state.controls(wolf)).toBeTrue()
        expect(state.controls(cart)).toBeTrue()
        // the GM's choice replaces the character's player
        expect(state.controls(borrowed)).toBeFalse()
        expect(state.ownTokens.map(token => token.id)).toEqual(["hero-token", "wolf-token", "cart-token"])
    })

    it('gives nobody else any token', () => {
        const state = new AppState()
        state.map = minimalMap({ tokens: [hero, rogue, cart] })
        expect(state.ownTokens).toEqual([])
        expect(state.primaryToken).toBeUndefined()
    })

    it('follows the token whose turn it is, else the first', () => {
        const state = playerState()
        expect(state.primaryToken?.id).toBe("hero-token")
        state.game = minimalGame({ combatantId: "c", combatants: [minimalCombatant({ id: "c", tokenId: "wolf-token" })] })
        expect(state.primaryToken?.id).toBe("wolf-token")
        state.game = minimalGame({ combatantId: "c", combatants: [minimalCombatant({ id: "c", tokenId: "rogue-token" })] })
        expect(state.primaryToken?.id).toBe("hero-token")
    })
})

describe('mayShowEntity', () => {
    const goblin = minimalToken({ id: 'goblin', reference: '/monster/goblin' })
    const aria = minimalToken({ id: 'aria', reference: '/character/aria', entityId: 'aria' })

    it('lets the GM open any token\'s entity', () => {
        const state = new AppState()
        expect(state.mayShowEntity(goblin, true)).toBeTrue()
    })

    it('lets a player open only the entity of a token they control', () => {
        const state = new AppState()
        state.tokenControl = { playerId: 'p1', characterIds: ['aria'] }
        expect(state.mayShowEntity(aria, false)).toBeTrue()
        expect(state.mayShowEntity(goblin, false)).toBeFalse()
        expect(state.mayShowEntity({ ...goblin, controlledBy: 'p1' }, false)).toBeTrue()
    })

    it('lets a guest open none', () => {
        expect(new AppState().mayShowEntity(aria, false)).toBeFalse()
    })

    it('opens nothing for a token without an entity', () => {
        expect(new AppState().mayShowEntity(minimalToken(), true)).toBeFalse()
    })
})
