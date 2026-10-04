import { AppState } from './models/app-state';
import { Role } from './models/token';
import { minimalCombatant, minimalToken } from './models/testing/fixtures';
import {
  assignedPlayerCombatant,
  assignedPlayerReference,
  assignedPlayerToken,
  combatantWithHitPoints,
  combatantWithInitiative,
  playerEffects,
} from './player-tools';

describe('player tools', () => {
  function buildState(role: Role = Role.friendly) {
    const state = new AppState();
    const embedded = minimalCombatant({
      id: 'combatant-1',
      tokenId: 'token-1',
      reference: '/embedded-sheet',
    });
    const live = minimalCombatant({
      id: 'combatant-1',
      tokenId: 'token-1',
      reference: '/live-sheet',
    });
    const token = minimalToken({
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
    state.map!.tokens[0].combatant = undefined;
    expect(assignedPlayerCombatant(state)).toBeUndefined();
    expect(assignedPlayerReference(state)).toBe('/token-sheet');
  });

  it('clamps HP while preserving the rest of combatant data', () => {
    const combatant = minimalCombatant({
      id: 'combatant-1',
      data: { hp: { current: 8, maximum: 12, temporary: 2, recovery: 7 }, note: 'keep' },
    });
    const patch = combatantWithHitPoints(combatant, 99, -4);
    expect(patch.data.hp).toEqual({ current: 12, maximum: 12, temporary: 0, recovery: 7 });
    expect(patch.data.note).toBe('keep');
  });

  it('updates only the first initiative result and preserves its metadata', () => {
    const combatant = minimalCombatant({
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
    const combatant = minimalCombatant({
      id: 'combatant-1',
      initiative: [{ id: 'initiative-1', value: null }],
    });
    expect(combatantWithInitiative(combatant, Number.NaN).initiative).toEqual([
      { id: 'initiative-1', value: null },
    ]);
  });

  it('creates the first initiative entry when Encounter+ has not created one yet', () => {
    const combatant = minimalCombatant({
      id: 'combatant-1',
      initiative: [],
    });
    expect(combatantWithInitiative(combatant, 14.8, 'new-initiative')).toEqual({
      id: 'combatant-1',
      initiative: [{ id: 'new-initiative', value: 14 }],
    });
  });

  it('normalizes valued and descriptive effects without inventing missing data', () => {
    const combatant = minimalCombatant({
      id: 'combatant-1',
      effects: [
        {
          id: 'frightened',
          name: 'Frightened',
          icon: 'icons/conditions.png',
          color: '#5B5F97',
          reference: '/condition/frightened-player-core',
          data: { stage: 2 },
        },
        { id: 'persistent-fire', name: 'Persistent Fire', data: { damage: { formula: '1d6' } }, descr: 'Ongoing fire damage.' },
      ],
    });

    expect(playerEffects(combatant)).toEqual([
      jasmine.objectContaining({
        id: 'frightened',
        name: 'Frightened',
        value: '2',
        reference: '/condition/frightened-player-core',
      }),
      jasmine.objectContaining({
        name: 'Persistent Fire',
        detail: '1d6',
        description: 'Ongoing fire damage.',
      }),
    ]);
  });

  it('accepts the alternate effect dictionary shape', () => {
    const combatant = minimalCombatant({
      id: 'combatant-1',
      data: { effects: { hidden: { label: 'Invisible' } } },
    });
    expect(playerEffects(combatant).map(effect => effect.name)).toEqual(['Invisible']);
  });

  it('excludes disabled effects consistently with token rendering', () => {
    const combatant = minimalCombatant({ effects: [
      { id: 'active', name: 'Active' },
      { id: 'disabled', name: 'Disabled', enabled: false },
    ] });
    expect(playerEffects(combatant).map(effect => effect.name)).toEqual(['Active']);
  });

  it('does not revive nested effects after the server explicitly clears the top-level field', () => {
    const staleNestedEffect = { hidden: { label: 'Invisible' } };

    expect(playerEffects(minimalCombatant({
      effects: null,
      data: { effects: staleNestedEffect },
    }))).toEqual([]);

    expect(playerEffects(minimalCombatant({
      effects: [],
      data: { effects: staleNestedEffect },
    }))).toEqual([]);
  });
});
