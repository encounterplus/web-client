import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColorPickerDirective } from 'ngx-color-picker';
import { AppState } from 'src/app/shared/models/app-state';

import { SettingsModalComponent } from './settings-modal.component';
import { SessionService } from 'src/app/shared/services/session.service';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let fixture: ComponentFixture<SettingsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SettingsModalComponent ],
      imports: [ FormsModule, ColorPickerDirective ],
      providers: [
        NgbActiveModal,
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SettingsModalComponent);
    component = fixture.componentInstance;
    component.state = new AppState();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('lists a signed-in player\'s characters with a portrait, else their icon, else an initial', () => {
    TestBed.inject(SessionService).session.set({
      role: 'player', permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice' },
      characters: [
        { id: 'a', name: 'Aria', kind: 'Character', detail: 'Elf Ranger', image: '/campaigns/c/aria.png' },
        { id: 'b', name: 'Bram', kind: 'Character', icon: 'gi-broadsword' },
        { id: 'c', name: 'cora', kind: 'Character' },
      ]
    });
    component.state.tokenControl = { playerId: 'p1', characterIds: ['a', 'b', 'c'] };
    fixture.detectChanges();

    const [aria, bram, cora] = component.characters;
    expect(aria.image).toMatch(/\/campaigns\/c\/aria\.png$/);
    expect(aria.detail).toBe('Elf Ranger');
    expect(bram.image).toBeUndefined();
    expect(bram.glyph).toBeTruthy();
    expect(cora.glyph).toBeUndefined();
    expect(cora.initial).toBe('C');
    expect(fixture.nativeElement.querySelectorAll('.characters .character').length).toBe(3);
  });

  it('says so when the player has no character', () => {
    TestBed.inject(SessionService).session.set({ role: 'player', permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice' }, characters: [] });
    component.state.tokenControl = { playerId: 'p1', characterIds: [] };
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.characters')).toBeNull();
    expect(fixture.nativeElement.querySelector('.characters-empty')).not.toBeNull();
  });

  it('offers no token to pick: the app says whose tokens are whose', () => {
    expect(fixture.nativeElement.querySelector('#token')).toBeNull();
  });
});
