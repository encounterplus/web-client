export type EntityFrameAction = EntityRollAction | EntityReferenceAction;

export interface EntityRollAction {
  kind: 'roll';
  formula: string;
  name: string;
  rollType?: 'check' | 'save' | 'attack' | 'damage';
}

export interface EntityReferenceAction {
  kind: 'reference';
  reference: string;
  title: string;
}

const ROLL_TYPES = new Set(['check', 'save', 'attack', 'damage']);

function rollFormula(value: string): string | undefined {
  const normalized = value
    .trim()
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/\s+/g, '');

  if (/^[+-]?\d+$/.test(normalized)) {
    const modifier = Number(normalized);
    if (!Number.isFinite(modifier)) return undefined;
    return modifier > 0 ? `1d20+${modifier}` : modifier < 0 ? `1d20${modifier}` : '1d20';
  }

  if (/^d\d+/i.test(normalized)) return `1${normalized}`;
  if (/^\d+d\d+/i.test(normalized)) return normalized;
  return undefined;
}

function rollLabel(value?: string | null): { name: string; rollType?: EntityRollAction['rollType'] } {
  const label = (value || '').trim();
  const segments = label.split('/');
  const possibleType = segments.length > 1 ? segments[segments.length - 1].toLowerCase() : '';

  if (ROLL_TYPES.has(possibleType)) {
    return {
      name: segments.slice(0, -1).join('/').trim() || 'Custom',
      rollType: possibleType as EntityRollAction['rollType'],
    };
  }

  return { name: label || 'Custom' };
}

export function entityFrameAction(anchor: HTMLAnchorElement, appBaseURL: string): EntityFrameAction | undefined {
  const rawHref = (anchor.getAttribute('href') || '').trim();
  const decodedHref = (() => {
    try { return decodeURIComponent(rawHref); } catch { return rawHref; }
  })();
  const data = anchor.dataset;
  let destination: URL | undefined;
  try {
    destination = rawHref ? new URL(rawHref, `${new URL(appBaseURL).origin}/`) : undefined;
  } catch {
    destination = undefined;
  }

  const pathSegments = destination?.pathname.split('/').filter(Boolean) || [];
  const rollIndex = pathSegments.findIndex(segment => segment.toLowerCase() === 'roll');
  const inlineRoll = decodedHref.match(/(?:^|[/:])roll(?:[/:\s]+([^?#\s"']+))?/i);
  const isRoll = rollIndex >= 0
    || Boolean(inlineRoll)
    || data['action']?.toLowerCase() === 'roll'
    || anchor.classList.contains('roll')
    || anchor.classList.contains('rollable')
    || data['roll'] !== undefined
    || data['formula'] !== undefined;

  if (isRoll) {
    const encodedPathFormula = rollIndex >= 0 ? pathSegments[rollIndex + 1] || '' : inlineRoll?.[1] || '';
    const pathFormula = (() => {
      try { return decodeURIComponent(encodedPathFormula); } catch { return encodedPathFormula; }
    })();
    const queryFormula = destination?.searchParams.get('formula') || destination?.searchParams.get('dice') || '';
    const formula = rollFormula(data['formula'] || data['roll'] || queryFormula)
      || rollFormula(pathFormula)
      || rollFormula(anchor.textContent || '');
    if (!formula) return undefined;

    const pathLabel = rollIndex >= 0 && pathSegments.length > rollIndex + 2
      ? pathSegments.slice(rollIndex + 2).join('/')
      : undefined;
    const label = data['name'] || data['label'] || data['rollName'] || anchor.getAttribute('title') || pathLabel;

    return {
      kind: 'roll',
      formula,
      ...rollLabel(label),
    };
  }

  if (!rawHref || rawHref.startsWith('#') || /^javascript:/i.test(rawHref)) return undefined;
  if (anchor.target && anchor.target.toLowerCase() !== '_self') return undefined;

  try {
    const base = new URL(appBaseURL);
    const referenceDestination = destination || new URL(rawHref, `${base.origin}/`);
    if (referenceDestination.origin !== base.origin) return undefined;

    return {
      kind: 'reference',
      reference: `${referenceDestination.pathname}${referenceDestination.search}${referenceDestination.hash}`,
      title: (anchor.textContent || '').trim() || 'Reference',
    };
  } catch {
    return undefined;
  }
}

export function rollCommand(action: EntityRollAction): string {
  const safeName = action.name.replace(/[\[\]]/g, '').trim() || 'Custom';
  const label = action.rollType ? `${safeName}:${action.rollType}` : safeName;
  return `/r ${action.formula} [${label}]`;
}
