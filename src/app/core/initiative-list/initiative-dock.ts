export type InitiativeDockPosition = 'right' | 'bottom';

export const INITIATIVE_DOCK_POSITION_KEY = 'initiativeDockPosition';

const positions: InitiativeDockPosition[] = ['right', 'bottom'];

export function storedInitiativeDockPosition(storage: Storage = localStorage): InitiativeDockPosition {
  const value = storage.getItem(INITIATIVE_DOCK_POSITION_KEY) as InitiativeDockPosition | null;
  return value && positions.includes(value) ? value : 'right';
}

export function saveInitiativeDock(
  position: InitiativeDockPosition,
  storage: Storage = localStorage,
): void {
  storage.setItem(INITIATIVE_DOCK_POSITION_KEY, position);
}

export function nextInitiativeDockPosition(position: InitiativeDockPosition): InitiativeDockPosition {
  return position === 'right' ? 'bottom' : 'right';
}
