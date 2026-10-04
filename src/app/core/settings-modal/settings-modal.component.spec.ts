import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ColorPickerDirective } from 'ngx-color-picker';
import { AppState } from 'src/app/shared/models/app-state';
import { Appearance } from 'src/app/shared/appearance';
import { DataService } from 'src/app/shared/services/data.service';

import { SettingsModalComponent } from './settings-modal.component';

describe('SettingsModalComponent', () => {
  let component: SettingsModalComponent;
  let fixture: ComponentFixture<SettingsModalComponent>;
  let dataService: DataService;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
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
    dataService = TestBed.inject(DataService);
    component.state = new AppState();
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no tokens without a map', () => {
    expect(component.tokens).toEqual([]);
  });

  it('restores community and upstream preferences together', () => {
    localStorage.setItem('appearance', Appearance.dark);
    localStorage.setItem('userTokenId', 'token-1');
    localStorage.setItem('playVideoAssets', 'false');

    component.ngOnInit();

    expect(component.appearance).toBe(Appearance.dark);
    expect(component.tokenId).toBe('token-1');
    expect(component.playVideoAssets).toBeFalse();
  });

  it('saves appearance and video preferences while clearing an unassigned token', () => {
    spyOn(dataService, 'send');
    spyOn(component.modalInstance, 'close');
    localStorage.setItem('userTokenId', 'old-token');
    component.state.userTokenId = 'old-token';
    component.remoteHost = dataService.remoteHost;
    component.runMode = component.state.runMode;
    component.tokenId = null;
    component.appearance = Appearance.light;
    component.playVideoAssets = false;

    component.save();

    expect(localStorage.getItem('userTokenId')).toBeNull();
    expect(component.state.userTokenId).toBeUndefined();
    expect(localStorage.getItem('appearance')).toBe(Appearance.light);
    expect(localStorage.getItem('playVideoAssets')).toBe('false');
    expect(document.documentElement.getAttribute('data-theme')).toBe(Appearance.light);
  });
});
