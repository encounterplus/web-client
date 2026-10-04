import { AppState } from './models/app-state';
import { Combatant } from './models/combatant';
import { Role, Token } from './models/token';
import { v4 as uuidv4 } from 'uuid';

export interface HitPointRange {
  current: number;
  maximum: number;
  temporary: number;
}

export interface PlayerEffect {
  id: string;
  name: string;
  value?: string;
  detail?: string;
  icon?: string;
  color?: string;
  reference?: string;
  description?: string;
}

function textValue(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function effectColor(value: unknown): string | undefined {
  return typeof value === 'string' && /^#[0-9a-f]{3,8}$/i.test(value.trim()) ? value.trim() : undefined;
}

export function playerEffects(combatant?: Combatant): PlayerEffect[] {
  // An explicit top-level null/empty value means the server removed every effect. Only use the
  // older nested representation when the top-level field is genuinely absent; `??` would revive
  // stale nested effects after the last top-level effect was removed.
  const hasTopLevelEffects = Boolean(combatant)
    && Object.prototype.hasOwnProperty.call(combatant, 'effects');
  const source = hasTopLevelEffects ? combatant?.effects : combatant?.data?.effects;
  const effects: unknown[] = Array.isArray(source)
    ? source
    : source && typeof source === 'object'
      ? Object.values(source)
      : [];

  return effects.flatMap((effect, index) => {
    if (typeof effect === 'string') {
      const name = effect.trim();
      return name ? [{ id: `effect-${index}-${name}`, name }] : [];
    }
    if (!effect || typeof effect !== 'object') return [];

    const record = effect as Record<string, any>;
    if (record['enabled'] === false) return [];
    const data = record['data'] && typeof record['data'] === 'object' ? record['data'] : {};
    const name = textValue(record['name'], record['label'], record['title'], data['name']);
    if (!name) return [];

    const stage = textValue(data['stage'], record['stage']);
    const rawValue = textValue(record['value'], data['value']);
    const value = stage && stage !== '0' ? stage : rawValue && rawValue !== '0' ? rawValue : undefined;
    const damage = record['damage'] && typeof record['damage'] === 'object' ? record['damage'] : {};
    const dataDamage = data['damage'] && typeof data['damage'] === 'object' ? data['damage'] : {};
    const detail = textValue(record['formula'], data['formula'], damage['formula'], dataDamage['formula']);
    const reference = textValue(record['reference'], data['reference']);
    const description = textValue(record['descr'], record['description'], data['descr'], data['description']);

    return [{
      id: textValue(record['id'], record['slug'], reference) || `effect-${index}-${name}`,
      name,
      value: value && !name.endsWith(` ${value}`) ? value : undefined,
      detail: detail !== value ? detail : undefined,
      icon: textValue(record['icon'], record['image'], data['icon'], data['image']),
      color: effectColor(record['color'] ?? data['color']),
      reference,
      description,
    }];
  });
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
  initiativeId?: string,
): Partial<Combatant> {
  const current = combatant.initiative || [];
  const initiatives = current.length
    ? current.map((initiative, index) =>
        index === 0 && Number.isFinite(value) ? { ...initiative, value: Math.trunc(value) } : { ...initiative }
      )
    : Number.isFinite(value)
      ? [{ id: initiativeId || uuidv4(), value: Math.trunc(value) }]
      : [];
  return { id: combatant.id, initiative: initiatives };
}
