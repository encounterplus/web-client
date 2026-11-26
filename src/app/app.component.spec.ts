import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AppState } from './shared/models/app-state';
import { DataService } from './shared/services/data.service';
import { Token } from './shared/models/token';
import { SessionService } from './shared/services/session.service';
import { FloatingWindowService } from './core/floating-window/floating-window.service';
import { characterWindow } from './core/floating-window/windows';
import { minimalMap, minimalToken } from './shared/models/testing/fixtures';
import { WSEvent } from './shared/models/wsevent';

// the real service opens a websocket on init, so the spec runs against a stub
function dataServiceStub() {
  return {
    state: new AppState(),
    remoteHost: "localhost",
    protocol: "http:",
    attemptNr: 0,
    baseURL: "http://localhost",
    pageUrl: (path: string) => "http://localhost" + path,
    events$: new Subject<WSEvent>(),
    // never emits, so neither the connected nor the disconnected branch runs
    connectionStatus$: new Subject<boolean>(),
    showEntityEmitter: new EventEmitter<Token>(),
    connect: jasmine.createSpy('connect'),
    send: jasmine.createSpy('send'),
    getData: jasmine.createSpy('getData').and.returnValue(EMPTY)
  };
}

describe('AppComponent', () => {
  let dataService: ReturnType<typeof dataServiceStub>;

  beforeEach(async () => {
    dataService = dataServiceStub();

    await TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: DataService, useValue: dataService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'external-screen'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('external-screen');
  });

  it('should start with a fresh app state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.state).toBeTruthy();
    expect(app.state.messages).toEqual([]);
  });

  it('should connect the websocket on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(dataService.connect).toHaveBeenCalled();
  });

  describe('floating windows', () => {
    let app: AppComponent;
    let session: SessionService;
    let windows: FloatingWindowService;

    const goblin = minimalToken({ id: 'goblin', name: 'Goblin', label: 'Goblin 2', reference: '/monster/goblin' });
    const aria = minimalToken({ id: 'aria', name: 'Aria', reference: '/character/aria', entityId: 'aria' });
    const player = {
      role: 'player' as const, permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice' },
      characters: [{ id: 'aria', name: 'Aria', kind: 'Character', url: '/sheet/aria' }],
    };

    beforeEach(() => {
      localStorage.removeItem('encounterplus.windows');
      const fixture = TestBed.createComponent(AppComponent);
      app = fixture.componentInstance;
      app.state.map = minimalMap({ tokens: [goblin, aria] });
      session = TestBed.inject(SessionService);
      windows = TestBed.inject(FloatingWindowService);
    });

    afterEach(() => localStorage.removeItem('encounterplus.windows'));

    function signIn(value: any) {
      session.session.set(value);
      TestBed.tick();
    }

    it('opens any token\'s stat block for the GM, one window per entity', () => {
      signIn({ role: 'gm', permissions: [] });
      app.showEntityAction(goblin);
      app.showEntityAction({ ...goblin, id: 'goblin-2' });
      expect(windows.windows().length).toBe(1);
      const [win] = windows.windows();
      expect(win.key).toBe('entity:/monster/goblin');
      expect(win.title).toBe('Goblin');
      expect(win.externalUrl).toBe('http://localhost/monster/goblin');
    });

    it('opens a player only the stat block of a token they control', () => {
      signIn(player);
      app.showEntityAction(goblin);
      expect(windows.windows().length).toBe(0);
      app.showEntityAction(aria);
      expect(windows.isOpen('entity:/character/aria')).toBeTrue();
    });

    it('opens a guest no stat block', () => {
      app.showEntityAction(aria);
      expect(windows.windows().length).toBe(0);
    });

    it('closes a stat block the new session no longer allows', () => {
      signIn({ role: 'gm', permissions: [] });
      app.showEntityAction(goblin);
      app.showEntityAction(aria);

      signIn(player);
      expect(windows.windows().map(win => win.key)).toEqual(['entity:/character/aria']);

      signIn(null);
      expect(windows.windows().length).toBe(0);
    });

    it('closes a character sheet that is no longer the player\'s, or whose address changed', () => {
      const sheet = characterWindow({ id: 'aria', name: 'Aria', initial: 'A', url: 'http://localhost/sheet/aria' });
      signIn(player);
      windows.open(sheet);

      signIn({ ...player, permissions: ['read'] });
      expect(windows.isOpen('character:aria')).toBeTrue();

      signIn({ ...player, characters: [{ ...player.characters[0], url: '/sheet/aria-2' }] });
      expect(windows.isOpen('character:aria')).toBeFalse();

      windows.open(characterWindow({ id: 'aria', name: 'Aria', initial: 'A', url: 'http://localhost/sheet/aria-2' }));
      signIn({ ...player, characters: [] });
      expect(windows.isOpen('character:aria')).toBeFalse();
    });
  });
});
