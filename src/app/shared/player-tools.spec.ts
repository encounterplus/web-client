import { AppState } from './models/app-state';
import { Combatant } from './models/combatant';
import { Role, Token } from './models/token';
import {
  assignedPlayerCombatant,
  assignedPlayerReference,
  assignedPlayerToken,
  combatantWithHitPoints,
  combatantWithInitiative,
} from './player-tools';

describe('player tools', () => {
  function buildState(role: Role = Role.friendly) {
    const state = new AppState();
    const embedded = Object.assign(new Combatant(), {
      id: 'combatant-1',
      tokenId: 'token-1',
      reference: '/embedded-sheet',
    });
    const live = Object.assign(new Combatant(), {
      id: 'combatant-1',
      tokenId: 'token-1',
      reference: '/live-sheet',
    });
    const token = Object.assign(new Token(), {
      id: 'token-1',
      role,
      reference: '/token-sheet',
      combatant: embedded,
    });
    state.userTokenId = token.id;
    state.map = { tokens: [token] } as any;
    state.game.combatants = [live];
    return { state, live };
  }

  it('only resolves an assigned friendly token', () => {
    expect(assignedPlayerToken(buildState().state)?.id).toBe('token-1');
    expect(assignedPlayerToken(buildState(Role.hostile).state)).toBeUndefined();
  });

  it('prefers the live encounter combatant and its sheet', () => {
    const { state, live } = buildState();
    expect(assignedPlayerCombatant(state)).toBe(live);
    expect(assignedPlayerReference(state)).toBe('/live-sheet');
  });

  it('keeps the token sheet available before the character enters combat', () => {
    const { state } = buildState();
    state.game.combatants = [];
    state.map.tokens[0].combatant = undefined;
    expect(assignedPlayerCombatant(state)).toBeUndefined();
    expect(assignedPlayerReference(state)).toBe('/token-sheet');
  });

  it('clamps HP while preserving the rest of combatant data', () => {
    const combatant = Object.assign(new Combatant(), {
      id: 'combatant-1',
      data: { hp: { current: 8, maximum: 12, temporary: 2, recovery: 7 }, note: 'keep' },
    });
    const patch = combatantWithHitPoints(combatant, 99, -4);
    expect(patch.data.hp).toEqual({ current: 12, maximum: 12, temporary: 0, recovery: 7 });
    expect(patch.data.note).toBe('keep');
  });

  it('updates only the first initiative result and preserves its metadata', () => {
    const combatant = Object.assign(new Combatant(), {
      id: 'combatant-1',
      initiative: [
        { id: 'initiative-1', name: 'Perception', value: 10, order: 3 },
        { id: 'initiative-2', name: 'Stealth', value: 8 },
      ],
    });
    const patch = combatantWithInitiative(combatant, 17.9);
    expect(patch.initiative).toEqual([
      { id: 'initiative-1', name: 'Perception', value: 17, order: 3 },
      { id: 'initiative-2', name: 'Stealth', value: 8 },
    ]);
  });

  it('does not turn a missing initiative value into zero', () => {
    const combatant = Object.assign(new Combatant(), {
      id: 'combatant-1',
      initiative: [{ id: 'initiative-1', value: null }],
    });
    expect(combatantWithInitiative(combatant, Number.NaN).initiative).toEqual([
      { id: 'initiative-1', value: null },
    ]);
  });
});
