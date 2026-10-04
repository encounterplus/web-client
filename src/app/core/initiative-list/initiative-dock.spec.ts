import {
  nextInitiativeDockPosition,
  saveInitiativeDock,
  storedInitiativeDockPosition,
} from './initiative-dock';

describe('initiative dock preferences', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to the right dock', () => {
    expect(storedInitiativeDockPosition()).toBe('right');
  });

  it('persists the chosen dock', () => {
    saveInitiativeDock('bottom');

    expect(storedInitiativeDockPosition()).toBe('bottom');
  });

  it('migrates the removed left position back to the right', () => {
    localStorage.setItem('initiativeDockPosition', 'left');
    expect(storedInitiativeDockPosition()).toBe('right');
  });

  it('ignores any other unknown stored position', () => {
    localStorage.setItem('initiativeDockPosition', 'top');
    expect(storedInitiativeDockPosition()).toBe('right');
  });
});

describe('nextInitiativeDockPosition', () => {
  it('toggles directly between the right and bottom docks', () => {
    expect(nextInitiativeDockPosition('right')).toBe('bottom');
    expect(nextInitiativeDockPosition('bottom')).toBe('right');
  });
});
