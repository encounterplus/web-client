import { Component, Input, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FloatingWindowComponent, resized } from './floating-window.component';
import { FloatingWindowService, MIN_HEIGHT, MIN_WIDTH } from './floating-window.service';
import { FloatingWindowRef } from './floating-window-ref';

@Component({ selector: 'app-content-stub', template: '<p class="stub">{{ text }}</p>', standalone: false })
class ContentStub {
  @Input() text = ''
}

/** Content that went elsewhere and can go back, as a page in a frame does. */
@Component({ selector: 'app-navigating-stub', template: '', standalone: false })
class NavigatingStub {
  readonly ref = inject(FloatingWindowRef)
}

describe('FloatingWindowComponent', () => {
  let windows: FloatingWindowService;
  let fixture: ComponentFixture<FloatingWindowComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    localStorage.removeItem('encounterplus.windows');
    await TestBed.configureTestingModule({
      declarations: [FloatingWindowComponent, ContentStub, NavigatingStub],
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

  it('offers going back only once its content went elsewhere', () => {
    expect(element.querySelector('.nav-back')).toBeNull();

    windows.close('a');
    windows.open({ key: 'a', title: 'Aria', component: NavigatingStub });
    render();
    const content: NavigatingStub = fixture.debugElement.query(debug => debug.componentInstance instanceof NavigatingStub).componentInstance;
    const back = jasmine.createSpy('back');
    content.ref.back.set(back);
    fixture.detectChanges();

    const button = element.querySelector<HTMLButtonElement>('.nav-back')!;
    expect(button).not.toBeNull();
    button.click();
    expect(back).toHaveBeenCalled();

    content.ref.back.set(null);
    fixture.detectChanges();
    expect(element.querySelector('.nav-back')).toBeNull();
  });

  it('does not move from the back button', () => {
    windows.close('a');
    windows.open({ key: 'a', title: 'Aria', component: NavigatingStub });
    windows.move('a', { x: 100, y: 100, width: 400, height: 300 });
    render();
    fixture.debugElement.query(debug => debug.componentInstance instanceof NavigatingStub).componentInstance.ref.back.set(() => {});
    fixture.detectChanges();
    drag(element.querySelector('.nav-back')!, 50, 30);
    expect(rect().x).toBe(100);
  });

  it('closes from its close button', () => {
    element.querySelector<HTMLButtonElement>('.btn-close')!.click();
    expect(windows.isOpen('a')).toBeFalse();
  });

  describe('double tap', () => {
    let now: number;

    beforeEach(() => {
      now = 1_000_000;
      spyOn(Date, 'now').and.callFake(() => now);
    });

    function tapTitle(x = 200, y = 110) {
      const bar = element.querySelector('.title-bar')!;
      pointer(bar, 'pointerdown', x, y);
      pointer(bar, 'pointerup', x + 2, y + 1);
      render();
    }

    it('fills the page, and again brings the window back to its default size', () => {
      tapTitle();
      now += 200;
      tapTitle();
      expect(windows.windows()[0].maximized).toBeTrue();
      expect(element.classList).toContain('maximized');
      expect(element.style.left).toBe('');
      expect(element.querySelector('.resize-se')).toBeNull();

      now += 1000;
      tapTitle();
      now += 200;
      tapTitle();
      expect(windows.windows()[0].maximized).toBeFalse();
      expect(rect().width).toBe(720);
      expect(element.style.width).toBe('720px');
    });

    it('takes taps too far apart in time or place as two taps', () => {
      tapTitle();
      now += 1000;
      tapTitle();
      now += 200;
      tapTitle(400, 110);
      expect(windows.windows()[0].maximized).toBeFalsy();
    });

    it('neither moves nor remembers a window for a tap', () => {
      localStorage.removeItem('encounterplus.windows');
      tapTitle();
      expect(rect()).toEqual({ x: 100, y: 100, width: 400, height: 300 });
      expect(localStorage.getItem('encounterplus.windows')).toBeNull();
    });

    it('keeps a window that fills the page in place when its title bar is dragged', () => {
      windows.toggleMaximized('a');
      render();
      drag(element.querySelector('.title-bar')!, 80, 80);
      expect(windows.windows()[0].maximized).toBeTrue();
      expect(rect()).toEqual({ x: 100, y: 100, width: 400, height: 300 });
    });
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
