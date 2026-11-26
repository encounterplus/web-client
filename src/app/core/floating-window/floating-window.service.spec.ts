import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FloatingWindowService, MIN_HEIGHT, MIN_WIDTH, TITLE_HEIGHT, clampRect } from './floating-window.service';

@Component({ template: '', standalone: false })
class ContentStub {}

const STORAGE_KEY = 'encounterplus.windows';

describe('FloatingWindowService', () => {
  let service: FloatingWindowService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(FloatingWindowService);
    service.viewportChanged(1200, 800);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  function open(key: string) {
    service.open({ key, title: key, component: ContentStub });
  }

  it('opens a window centred, sized for a sheet, within the page', () => {
    open('a');
    const [win] = service.windows();
    expect(win.width).toBe(720);
    expect(win.height).toBe(640);
    expect(win.x).toBe(240);
    expect(win.y).toBe(80);
    expect(service.front()).toBe('a');
  });

  it('cascades each next window a little down and right', () => {
    open('a');
    open('b');
    const [a, b] = service.windows();
    expect(b.x - a.x).toBe(24);
    expect(b.y - a.y).toBe(24);
  });

  it('brings an open key to the front rather than opening it twice', () => {
    open('a');
    open('b');
    open('a');
    expect(service.windows().map(win => win.key)).toEqual(['a', 'b']);
    expect(service.front()).toBe('a');
  });

  it('brings a window to the front without moving it in the list, which would reload its iframe', () => {
    open('a');
    open('b');
    open('c');
    service.focus('a');
    expect(service.windows().map(win => win.key)).toEqual(['a', 'b', 'c']);
    expect(service.front()).toBe('a');
    const [a, b, c] = service.windows();
    expect(a.z).toBeGreaterThan(c.z);
    expect(c.z).toBeGreaterThan(b.z);
  });

  it('closes a window, and the ones a predicate picks', () => {
    open('character:1');
    open('character:2');
    open('entity:/monster/goblin');
    service.close('character:1');
    expect(service.isOpen('character:1')).toBeFalse();
    service.closeWhere(win => win.key.startsWith('character:'));
    expect(service.windows().map(win => win.key)).toEqual(['entity:/monster/goblin']);
    expect(service.front()).toBe('entity:/monster/goblin');
  });

  it('has no window in front with none open', () => {
    expect(service.front()).toBeUndefined();
  });

  it('remembers where a window was moved for the next time its key opens', () => {
    open('a');
    service.move('a', { x: 10, y: 20, width: 400, height: 300 });
    service.close('a');
    open('a');
    expect(service.windows()[0]).toEqual(jasmine.objectContaining({ x: 10, y: 20, width: 400, height: 300 }));
  });

  it('opens in the default place when what it remembers is not a place', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ a: { x: 'left' } }));
    open('a');
    expect(service.windows()[0].width).toBe(720);
    localStorage.setItem(STORAGE_KEY, 'not json');
    open('b');
    expect(service.windows()[1].width).toBe(720);
  });

  it('remembers only the most recently placed windows', () => {
    for (let i = 0; i < 60; i++) {
      open(`entity:${i}`);
      service.move(`entity:${i}`, { x: i, y: 0, width: 400, height: 300 });
    }
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(Object.keys(saved).length).toBe(50);
    expect(saved['entity:59']).toBeDefined();
    expect(saved['entity:0']).toBeUndefined();
  });

  it('brings windows back onto a page that got smaller', () => {
    open('a');
    service.move('a', { x: 900, y: 600, width: 720, height: 640 });
    service.viewportChanged(600, 500);
    const [win] = service.windows();
    expect(win.width).toBe(600);
    expect(win.height).toBe(500);
    expect(win.x).toBeLessThanOrEqual(600 - 96);
    expect(win.y).toBeLessThanOrEqual(500 - TITLE_HEIGHT);
  });

  it('fills a phone\'s page with windows', () => {
    expect(service.compact()).toBeFalse();
    service.viewportChanged(390, 844);
    expect(service.compact()).toBeTrue();
  });
});

describe('clampRect', () => {
  it('keeps the title bar on the page and some of the window across each side', () => {
    expect(clampRect({ x: -1000, y: -50, width: 400, height: 300 }, 1200, 800)).toEqual({ x: 96 - 400, y: 0, width: 400, height: 300 });
    expect(clampRect({ x: 5000, y: 5000, width: 400, height: 300 }, 1200, 800)).toEqual({ x: 1200 - 96, y: 800 - TITLE_HEIGHT, width: 400, height: 300 });
  });

  it('keeps a window no smaller than a window can be, and no larger than the page', () => {
    expect(clampRect({ x: 0, y: 0, width: 10, height: 10 }, 1200, 800)).toEqual({ x: 0, y: 0, width: MIN_WIDTH, height: MIN_HEIGHT });
    expect(clampRect({ x: 0, y: 0, width: 5000, height: 5000 }, 1200, 800)).toEqual({ x: 0, y: 0, width: 1200, height: 800 });
  });
});
