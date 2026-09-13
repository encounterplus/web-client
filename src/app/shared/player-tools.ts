import { AppState } from './models/app-state';
import { Combatant } from './models/combatant';
import { Role, Token } from './models/token';

export interface HitPointRange {
  current: number;
  maximum: number;
  temporary: number;
}

export function assignedPlayerToken(state: AppState): Token | undefined {
  const storedTokenId = typeof localStorage === 'undefined' ? null : localStorage.getItem('userTokenId');
  const tokenId = state.userTokenId || storedTokenId;
  return state.map?.tokens?.find(token => token.id === tokenId && token.role === Role.friendly);
}

export function assignedPlayerCombatant(state: AppState): Combatant | undefined {
  const token = assignedPlayerToken(state);
  if (!token) return undefined;

  return state.game?.combatants?.find(combatant =>
    combatant.tokenId === token.id || combatant.id === token.combatant?.id
  ) || token.combatant;
}

export function assignedPlayerReference(state: AppState): string | undefined {
  const token = assignedPlayerToken(state);
  return assignedPlayerCombatant(state)?.reference || token?.reference;
}

export function hitPoints(combatant?: Combatant): HitPointRange | undefined {
  const hp = combatant?.data?.hp;
  if (!hp || !Number.isFinite(Number(hp.maximum))) return undefined;

  const maximum = Math.max(0, Number(hp.maximum));
  const rawCurrent = Number(hp.current ?? maximum);
  const rawTemporary = Number(hp.temporary ?? 0);

  return {
    current: Number.isFinite(rawCurrent) ? Math.min(maximum, Math.max(0, rawCurrent)) : maximum,
    maximum,
    temporary: Number.isFinite(rawTemporary) ? Math.max(0, rawTemporary) : 0,
  };
}

export function combatantWithHitPoints(
  combatant: Combatant,
  current: number,
  temporary: number,
): Partial<Combatant> {
  const hp = hitPoints(combatant);
  if (!hp) return { id: combatant.id };

  const nextCurrent = Number.isFinite(current)
    ? Math.min(hp.maximum, Math.max(0, Math.trunc(current)))
    : hp.current;
  const nextTemporary = Number.isFinite(temporary)
    ? Math.max(0, Math.trunc(temporary))
    : hp.temporary;
  return {
    id: combatant.id,
    data: {
      ...(combatant.data || {}),
      hp: {
        ...(combatant.data?.hp || {}),
        current: nextCurrent,
        temporary: nextTemporary,
      },
    },
  };
}

export function combatantWithInitiative(
  combatant: Combatant,
  value: number,
): Partial<Combatant> {
  const initiatives = (combatant.initiative || []).map((initiative, index) =>
    index === 0 && Number.isFinite(value) ? { ...initiative, value: Math.trunc(value) } : { ...initiative }
  );
  return { id: combatant.id, initiative: initiatives };
}
