import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FloatingWindowComponent, resized } from './floating-window.component';
import { FloatingWindowService, MIN_HEIGHT, MIN_WIDTH } from './floating-window.service';

@Component({ selector: 'app-content-stub', template: '<p class="stub">{{ text }}</p>', standalone: false })
class ContentStub {
  @Input() text = ''
}

describe('FloatingWindowComponent', () => {
  let windows: FloatingWindowService;
  let fixture: ComponentFixture<FloatingWindowComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.removeItem('encounterplus.windows');
    await TestBed.configureTestingModule({
      declarations: [FloatingWindowComponent, ContentStub],
    }).compileComponents();

    windows = TestBed.inject(FloatingWindowService);
    windows.viewportChanged(1200, 800);
    windows.open({ key: 'a', title: 'Aria', component: ContentStub, inputs: { text: 'sheet' }, externalUrl: 'http://host/sheet/a' });
    windows.move('a', { x: 100, y: 100, width: 400, height: 300 });
    fixture = TestBed.createComponent(FloatingWindowComponent);
    render();
  });

  afterEach(() => localStorage.removeItem('encounterplus.windows'));

  function render() {
    fixture.componentRef.setInput('win', windows.windows().find(win => win.key == 'a'));
    fixture.detectChanges();
    element = fixture.nativeElement;
  }

  function pointer(target: Element, type: string, x: number, y: number) {
    target.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, clientX: x, clientY: y }));
  }

  function drag(target: Element, dx: number, dy: number) {
    pointer(target, 'pointerdown', 200, 200);
    pointer(target, 'pointermove', 200 + dx, 200 + dy);
    fixture.detectChanges();
    pointer(target, 'pointerup', 200 + dx, 200 + dy);
    render();
  }

  function rect() {
    const { x, y, width, height } = windows.windows()[0];
    return { x, y, width, height };
  }

  it('shows its title and content', () => {
    expect(element.querySelector('.title')!.textContent).toBe('Aria');
    expect(element.querySelector('.stub')!.textContent).toBe('sheet');
    expect(element.style.left).toBe('100px');
    expect(element.style.width).toBe('400px');
  });

  it('offers its content in a tab of its own', () => {
    const link = element.querySelector<HTMLAnchorElement>('a.open-external')!;
    expect(link.href).toBe('http://host/sheet/a');
    expect(link.target).toBe('_blank');
  });

  it('offers no tab without an address', () => {
    windows.close('a');
    windows.open({ key: 'a', title: 'Notes', component: ContentStub });
    render();
    expect(element.querySelector('a.open-external')).toBeNull();
  });

  it('moves by its title bar and remembers where it ended up', () => {
    drag(element.querySelector('.title-bar')!, 50, 30);
    expect(rect()).toEqual({ x: 150, y: 130, width: 400, height: 300 });
    expect(element.style.left).toBe('150px');
  });

  it('follows the pointer while it drags, before it lets go', () => {
    const bar = element.querySelector('.title-bar')!;
    pointer(bar, 'pointerdown', 200, 200);
    pointer(bar, 'pointermove', 260, 200);
    fixture.detectChanges();
    expect(element.style.left).toBe('160px');
    expect(element.classList).toContain('interacting');
    expect(rect().x).toBe(100);
    pointer(bar, 'pointerup', 260, 200);
    fixture.detectChanges();
    expect(element.classList).not.toContain('interacting');
  });

  it('does not move from a button in the title bar', () => {
    drag(element.querySelector('.btn-close')!, 50, 30);
    expect(rect().x).toBe(100);
  });

  it('resizes from a corner, no smaller than a window can be', () => {
    drag(element.querySelector('.resize-se')!, 100, 50);
    expect(rect()).toEqual({ x: 100, y: 100, width: 500, height: 350 });
    drag(element.querySelector('.resize-se')!, -1000, -1000);
    expect(rect()).toEqual({ x: 100, y: 100, width: MIN_WIDTH, height: MIN_HEIGHT });
  });

  it('resizes from the left edge, keeping its right edge in place', () => {
    drag(element.querySelector('.resize-w')!, -50, 0);
    expect(rect()).toEqual({ x: 50, y: 100, width: 450, height: 300 });
  });

  it('comes to the front when a pointer goes down on it', () => {
    windows.open({ key: 'b', title: 'Bram', component: ContentStub });
    render();
    expect(element.classList).not.toContain('front');
    pointer(element.querySelector('.content')!, 'pointerdown', 300, 300);
    render();
    expect(windows.front()).toBe('a');
    expect(element.classList).toContain('front');
  });

  it('closes from its close button', () => {
    element.querySelector<HTMLButtonElement>('.btn-close')!.click();
    expect(windows.isOpen('a')).toBeFalse();
  });

  it('fills a phone\'s page and neither moves nor resizes there', () => {
    windows.viewportChanged(390, 844);
    render();
    expect(element.classList).toContain('compact');
    expect(element.style.left).toBe('');
    expect(element.querySelector('.resize-se')).toBeNull();
    const before = rect();
    drag(element.querySelector('.title-bar')!, 50, 30);
    expect(rect()).toEqual(before);
  });
});

describe('resized', () => {
  const start = { x: 100, y: 100, width: 400, height: 300 };

  it('moves the edges it is given', () => {
    expect(resized(start, 'e', 10, 99)).toEqual({ x: 100, y: 100, width: 410, height: 300 });
    expect(resized(start, 's', 99, 10)).toEqual({ x: 100, y: 100, width: 400, height: 310 });
    expect(resized(start, 'nw', 10, 10)).toEqual({ x: 110, y: 110, width: 390, height: 290 });
  });

  it('stops the top edge at the top of the page', () => {
    expect(resized(start, 'n', 0, -150)).toEqual({ x: 100, y: 0, width: 400, height: 400 });
  });
});
