import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { AppState } from 'src/app/shared/models/app-state';
import { Role } from 'src/app/shared/models/token';
import { minimalCombatant, minimalToken } from 'src/app/shared/models/testing/fixtures';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { DataService } from 'src/app/shared/services/data.service';
import { PlayerPanelComponent } from './player-panel.component';

describe('PlayerPanelComponent', () => {
  function buildState(): AppState {
    const state = new AppState();
    state.userTokenId = 'token-1';
    state.map = {
      tokens: [
        minimalToken({ id: 'token-1', name: 'One', role: Role.friendly, reference: '/character/one' }),
        minimalToken({ id: 'token-2', name: 'Two', role: Role.friendly, reference: '/character/two' }),
      ],
    } as any;
    state.game.combatants = [
      minimalCombatant({
        id: 'combatant-1',
        tokenId: 'token-1',
        data: { hp: { current: 10, maximum: 10, temporary: 0 } },
        initiative: [{ id: 'initiative-1', value: null }],
      }),
      minimalCombatant({
        id: 'combatant-2',
        tokenId: 'token-2',
        data: { hp: { current: 16, maximum: 20, temporary: 1 } },
        initiative: [{ id: 'initiative-2', value: null }],
      }),
    ];
    return state;
  }

  function createComponent(state = buildState()) {
    const dataService = { send: jasmine.createSpy('send') };
    const component = new PlayerPanelComponent(dataService as any);
    component.state = state;
    component.ngOnInit();
    return { component, dataService, state };
  }

  it('reloads drafts when the assigned token changes', () => {
    const { component, state } = createComponent();
    component.currentHP = 3;
    component.hpDirty = true;

    state.userTokenId = 'token-2';
    component.ngDoCheck();

    expect(component.currentHP).toBe(16);
    expect(component.temporaryHP).toBe(1);
    expect(component.sheetReference).toBe('/character/two');
  });

  it('preserves a local draft while refreshing untouched server values', () => {
    const { component, state } = createComponent();
    component.currentHP = 4;
    component.hpDirty = true;
    state.game.combatants[0].data.hp.current = 7;

    component.ngDoCheck();

    expect(component.currentHP).toBe(4);
  });

  it('sends a partial combatant HP update', () => {
    const { component, dataService } = createComponent();
    component.currentHP = 6;
    component.temporaryHP = 2;
    component.hpDirty = true;

    component.saveHitPoints();

    expect(dataService.send).toHaveBeenCalledWith(jasmine.objectContaining({
      name: WSEventName.updateCombatant,
      data: jasmine.objectContaining({
        id: 'combatant-1',
        data: jasmine.objectContaining({ hp: jasmine.objectContaining({ current: 6, temporary: 2 }) }),
      }),
    }));
  });

  it('does not allow initiative updates after combat starts', () => {
    const { component, dataService, state } = createComponent();
    state.game.started = true;
    component.initiativeValue = 18;

    component.saveInitiative();

    expect(dataService.send).not.toHaveBeenCalled();
  });

  it('allows the player to set initiative before an initiative entry exists', () => {
    const { component, dataService, state } = createComponent();
    state.game.combatants[0].initiative = [];
    component.initiativeValue = 15;

    expect(component.canSetInitiative).toBeTrue();
    component.saveInitiative();

    const event = dataService.send.calls.mostRecent().args[0];
    expect(event.name).toBe(WSEventName.updateCombatant);
    expect(event.data.initiative.length).toBe(1);
    expect(event.data.initiative[0].value).toBe(15);
    expect(event.data.initiative[0].id).toBeTruthy();
  });
});

describe('PlayerPanelComponent live rendering', () => {
  let fixture: ComponentFixture<PlayerPanelComponent>;
  let component: PlayerPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PlayerPanelComponent],
      imports: [FormsModule],
      providers: [{
        provide: DataService,
        useValue: { baseURL: 'http://localhost', send: jasmine.createSpy('send') },
      }],
    }).compileComponents();

    fixture = TestBed.createComponent(PlayerPanelComponent);
    component = fixture.componentInstance;
  });

  it('replaces the empty state and clears the final effect whenever its parent refreshes', () => {
    const state = new AppState();
    state.userTokenId = 'token-1';
    state.map = { tokens: [] } as any;
    component.state = state;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Choose your friendly character token');

    state.map = {
      tokens: [minimalToken({ id: 'token-1', name: 'Mira', role: Role.friendly })],
    } as any;
    state.game.combatants = [minimalCombatant({
      id: 'hero-1',
      tokenId: 'token-1',
      name: 'Mira',
      effects: [{ id: 'frightened', name: 'Frightened' }],
    })];
    fixture.componentRef.setInput('stateRevision', 1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.player-header')?.textContent).toContain('Mira');
    expect(fixture.nativeElement.querySelector('.effect-section')?.textContent).toContain('Frightened');

    state.game.combatants[0].effects = [];
    fixture.componentRef.setInput('stateRevision', 2);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.effect-section')).toBeNull();
  });

  it("uses the token's live combatant effects instead of a stale game copy", () => {
    const state = new AppState();
    state.userTokenId = 'token-1';
    state.map = {
      tokens: [minimalToken({
        id: 'token-1',
        name: 'Mira',
        role: Role.friendly,
        combatant: minimalCombatant({ id: 'hero-1', tokenId: 'token-1', effects: [] }),
      })],
    } as any;
    state.game.combatants = [minimalCombatant({
      id: 'hero-1',
      tokenId: 'token-1',
      effects: [{ id: 'frightened', name: 'Frightened' }],
    })];
    component.state = state;

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.effect-section')).toBeNull();
  });
});
