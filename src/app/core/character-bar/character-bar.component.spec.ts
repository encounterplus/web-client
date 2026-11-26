import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { CharacterBarComponent } from './character-bar.component';
import { DataService } from 'src/app/shared/services/data.service';
import { Session, SessionService } from 'src/app/shared/services/session.service';
import { FloatingWindowService } from '../floating-window/floating-window.service';
import { IframeContentComponent } from '../floating-window/iframe-content.component';

describe('CharacterBarComponent', () => {
  let fixture: ComponentFixture<CharacterBarComponent>;
  let session: SessionService;
  let windows: FloatingWindowService;

  const player: Session = {
    role: 'player', permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice', color: '#ff0000' },
    characters: [
      { id: 'a', name: 'Aria', kind: 'Character', image: '/campaigns/c/aria.png', url: '/sheet/a' },
      { id: 'b', name: 'Bram', kind: 'Character', icon: 'gi-broadsword' },
    ],
  };

  beforeEach(async () => {
    localStorage.removeItem('encounterplus.windows');
    await TestBed.configureTestingModule({
      declarations: [CharacterBarComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    }).compileComponents();

    const dataService = TestBed.inject(DataService);
    dataService.protocol = 'http:';
    dataService.remoteHost = '192.168.1.42:8080';
    session = TestBed.inject(SessionService);
    windows = TestBed.inject(FloatingWindowService);
    fixture = TestBed.createComponent(CharacterBarComponent);
  });

  afterEach(() => localStorage.removeItem('encounterplus.windows'));

  function portraits(): HTMLButtonElement[] {
    fixture.detectChanges();
    return Array.from(fixture.nativeElement.querySelectorAll('button.portrait'));
  }

  it('shows nothing for a guest, the GM or an API key', () => {
    expect(portraits().length).toBe(0);
    session.session.set({ role: 'gm', permissions: [] });
    expect(portraits().length).toBe(0);
    session.session.set({ role: 'integration', permissions: [] });
    expect(portraits().length).toBe(0);
  });

  it('shows a player\'s characters, ringed in the player\'s colour', () => {
    session.session.set(player);
    const [aria, bram] = portraits();
    expect(aria.querySelector('img')!.src).toBe('http://192.168.1.42:8080/campaigns/c/aria.png');
    expect(bram.querySelector('.glyph')).not.toBeNull();
    expect(aria.style.getPropertyValue('--ring-color')).toBe('#ff0000');
  });

  it('dims a character with no sheet to open, which opens nothing', () => {
    session.session.set(player);
    const [aria, bram] = portraits();
    expect(aria.disabled).toBeFalse();
    expect(bram.disabled).toBeTrue();
    fixture.componentInstance.toggle(fixture.componentInstance.characters[1]);
    expect(windows.windows().length).toBe(0);
  });

  it('opens the sheet in a window, offering it in a tab of its own', () => {
    session.session.set(player);
    portraits()[0].click();
    const [win] = windows.windows();
    expect(win.key).toBe('character:a');
    expect(win.title).toBe('Aria');
    expect(win.component).toBe(IframeContentComponent);
    expect(win.inputs).toEqual({ url: 'http://192.168.1.42:8080/sheet/a', title: 'Aria' });
    expect(win.externalUrl).toBe('http://192.168.1.42:8080/sheet/a');
    expect(portraits()[0].classList).toContain('open');
  });

  it('brings an open sheet behind another window forward, and closes it when it is in front', () => {
    session.session.set(player);
    portraits()[0].click();
    windows.open({ key: 'other', title: 'Other', component: IframeContentComponent, inputs: { url: 'about:blank' } });

    portraits()[0].click();
    expect(windows.front()).toBe('character:a');
    expect(windows.windows().length).toBe(2);

    portraits()[0].click();
    expect(windows.isOpen('character:a')).toBeFalse();
    expect(portraits()[0].classList).not.toContain('open');
  });
});
