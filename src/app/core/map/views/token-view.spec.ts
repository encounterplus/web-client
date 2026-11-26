import { Container } from 'pixi.js';
import { AppState } from 'src/app/shared/models/app-state';
import { ScreenInteraction } from 'src/app/shared/models/screen';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { minimalToken } from 'src/app/shared/models/testing/fixtures';
import { DataService } from 'src/app/shared/services/data.service';
import { SquareGrid } from '../models/square-grid';
import { ControlState, TAP_SLOP, TAP_TIME, TokenView } from './token-view';

describe('TokenView taps and drags', () => {
  let state: AppState;
  let dataService: { state: AppState, send: jasmine.Spy, showEntity: jasmine.Spy };
  let view: TokenView;
  let now: number;

  const aria = minimalToken({ id: 'aria', reference: '/character/aria', entityId: 'aria' });

  beforeEach(() => {
    now = 1_000_000;
    spyOn(Date, 'now').and.callFake(() => now);
    state = new AppState();
    state.screen.interaction = ScreenInteraction.none;
    // a signed-in player who plays Aria
    state.tokenControl = { playerId: 'p1', characterIds: ['aria'] };
    dataService = { state, send: jasmine.createSpy('send'), showEntity: jasmine.createSpy('showEntity') };
  });

  /** A token view on a map, as the layers hold it: the map follows a drag's pointer. */
  function place(token = aria) {
    view = new TokenView(token, new SquareGrid(), dataService as unknown as DataService);
    const map = new Container();
    const layer = new Container();
    map.addChild(layer);
    layer.addChild(view);
    view.updateInteraction();
  }

  function pointer(type: string, x: number, y: number, extra: object = {}) {
    const event: any = {
      type, pointerId: 1, global: { x, y }, shiftKey: false,
      stopPropagation: jasmine.createSpy('stopPropagation'),
      getLocalPosition: () => ({ x, y }),
      ...extra,
    };
    event.data = event;
    return event;
  }

  function tap(x = 10, y = 10, extra: object = {}) {
    const down = pointer('pointerdown', x, y, extra);
    view.onDragStart(down);
    now += 100;
    view.onDragEnd(pointer('pointerup', x + 2, y + 2, extra));
    return down;
  }

  function moves(): ControlState[] {
    return dataService.send.calls.allArgs()
      .filter(([event]) => event.name == WSEventName.tokenMoved)
      .map(([event]) => event.data.state);
  }

  it('takes no pointer on a token it may neither move nor inspect', () => {
    place(minimalToken({ id: 'goblin', reference: '/monster/goblin' }));
    expect(view.eventMode).toBe('none');
  });

  it('opens the stat block of a token the player may only inspect, leaving the press to the map', () => {
    place();
    expect(view.movable).toBeFalse();
    expect(view.inspectable).toBeTrue();
    expect(view.eventMode).toBe('static');

    const down = tap();
    expect(down.stopPropagation).not.toHaveBeenCalled();
    expect(dataService.showEntity).toHaveBeenCalledOnceWith(aria);
    expect(moves()).toEqual([]);
  });

  it('opens nothing when the map panned under the press', () => {
    place();
    view.onDragStart(pointer('pointerdown', 10, 10));
    view.onDragEnd(pointer('pointerup', 10 + TAP_SLOP + 20, 10));
    expect(dataService.showEntity).not.toHaveBeenCalled();
  });

  it('opens nothing for a held, cancelled or shift-pressed press', () => {
    place();
    view.onDragStart(pointer('pointerdown', 10, 10));
    now += TAP_TIME + 1;
    view.onDragEnd(pointer('pointerup', 10, 10));

    view.onDragStart(pointer('pointerdown', 10, 10));
    view.onDragEnd(pointer('pointercancel', 10, 10));

    tap(10, 10, { shiftKey: true });
    expect(dataService.showEntity).not.toHaveBeenCalled();
  });

  it('taps a token the player can move without moving it', () => {
    state.screen.interaction = ScreenInteraction.token;
    place();
    expect(view.movable).toBeTrue();

    const down = tap();
    expect(down.stopPropagation).toHaveBeenCalled();
    expect(dataService.showEntity).toHaveBeenCalledOnceWith(aria);
    expect(moves()).toEqual([]);
  });

  it('drags a movable token once the press moves, and opens nothing', () => {
    state.screen.interaction = ScreenInteraction.token;
    place();

    view.onDragStart(pointer('pointerdown', 10, 10));
    view.onDragMove(pointer('pointermove', 12, 12));
    expect(view.dragging).toBeFalse();
    view.onDragMove(pointer('pointermove', 40, 10));
    expect(view.dragging).toBeTrue();
    now += 100;
    view.onDragEnd(pointer('pointerup', 40, 10));

    expect(view.dragging).toBeFalse();
    expect(moves()).toEqual([ControlState.start, ControlState.control, ControlState.end]);
    expect(dataService.showEntity).not.toHaveBeenCalled();
  });

  it('never drags a token it may only inspect', () => {
    place();
    view.onDragStart(pointer('pointerdown', 10, 10));
    view.onDragMove(pointer('pointermove', 40, 10));
    expect(view.dragging).toBeFalse();
    expect(moves()).toEqual([]);
  });

  it('lets the player inspect, not move, their token while the game is paused', () => {
    state.screen.interaction = ScreenInteraction.token;
    state.paused = true;
    place();
    expect(view.movable).toBeFalse();
    expect(view.eventMode).toBe('static');
    tap();
    expect(dataService.showEntity).toHaveBeenCalled();
  });

  it('lets the GM inspect any token with an entity', () => {
    state.tokenControl = undefined;
    state.isGM = true;
    place(minimalToken({ id: 'goblin', reference: '/monster/goblin' }));
    expect(view.eventMode).toBe('static');
    tap();
    expect(dataService.showEntity).toHaveBeenCalled();
  });

  it('takes a new press after one whose pointer never came up', () => {
    place();
    view.onDragStart(pointer('pointerdown', 10, 10, { pointerId: 7 }));
    tap();
    expect(dataService.showEntity).toHaveBeenCalledOnceWith(aria);
  });
});
