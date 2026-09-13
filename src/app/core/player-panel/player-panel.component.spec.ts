import { AppState } from 'src/app/shared/models/app-state';
import { Combatant } from 'src/app/shared/models/combatant';
import { Role, Token } from 'src/app/shared/models/token';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { PlayerPanelComponent } from './player-panel.component';

describe('PlayerPanelComponent', () => {
  function buildState(): AppState {
    const state = new AppState();
    state.userTokenId = 'token-1';
    state.map = {
      tokens: [
        Object.assign(new Token(), { id: 'token-1', name: 'One', role: Role.friendly, reference: '/character/one' }),
        Object.assign(new Token(), { id: 'token-2', name: 'Two', role: Role.friendly, reference: '/character/two' }),
      ],
    } as any;
    state.game.combatants = [
      Object.assign(new Combatant(), {
        id: 'combatant-1',
        tokenId: 'token-1',
        data: { hp: { current: 10, maximum: 10, temporary: 0 } },
        initiative: [{ id: 'initiative-1', value: null }],
      }),
      Object.assign(new Combatant(), {
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
});
