import { TestBed } from '@angular/core/testing';

import { DataService, deepMerge } from './data.service';
import { Game } from '../models/game';
import { minimalCombatant, minimalGame } from '../models/testing/fixtures';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

describe('deepMerge', () => {

  it('returns the target untouched when there is no patch', () => {
    const target = minimalGame({ round: 2 });
    expect(deepMerge(target, null as unknown as Partial<Game>)).toBe(target);
    expect(deepMerge(target, undefined as unknown as Partial<Game>)).toBe(target);
  });

  it('merges the fields the patch carries and leaves the rest alone', () => {
    const merged = deepMerge(minimalGame({ round: 1, turn: 3 }), { round: 2 });
    expect(merged.round).toBe(2);
    expect(merged.turn).toBe(3);
    expect(merged.started).toBe(false);
  });

  it('does not mutate the target', () => {
    const target = minimalGame({ round: 1 });
    deepMerge(target, { round: 2 });
    expect(target.round).toBe(1);
  });

  it('replaces an array wholesale rather than merging it', () => {
    const merged = deepMerge(
      minimalGame({ combatants: [minimalCombatant({ id: "a" }), minimalCombatant({ id: "b" })] }),
      { combatants: [minimalCombatant({ id: "c" })] });
    expect(merged.combatants.map(combatant => combatant.id)).toEqual(["c"]);
  });

  it('merges nested objects one level down', () => {
    const merged = deepMerge(
      { outer: { kept: 1, replaced: 1 } },
      { outer: { replaced: 2 } } as Partial<{ outer: { kept: number, replaced: number } }>);
    expect(merged.outer).toEqual({ kept: 1, replaced: 2 });
  });

  it('builds a nested object the target does not have yet', () => {
    const merged = deepMerge<{ outer?: { value: number } }>({}, { outer: { value: 1 } });
    expect(merged.outer).toEqual({ value: 1 });
  });

  // the server clears an optional field by sending it as null, so null has to win over the
  // target's value rather than being skipped as "nothing to merge"
  it('lets an explicit null in the patch clear the field', () => {
    const merged = deepMerge(minimalGame({ combatantId: "a" }), { combatantId: null as unknown as string });
    expect(merged.combatantId).toBeNull();
  });

  it('replaces the whole value when the patch is not an object', () => {
    expect(deepMerge<any>({ a: 1 }, 5 as any)).toBe(5);
    expect(deepMerge<any>({ a: 1 }, [1, 2] as any)).toEqual([1, 2]);
  });
});
