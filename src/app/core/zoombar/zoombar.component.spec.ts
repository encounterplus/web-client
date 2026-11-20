import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppState } from 'src/app/shared/models/app-state';
import { minimalMap, minimalToken } from 'src/app/shared/models/testing/fixtures';

import { ZoombarComponent } from './zoombar.component';

describe('ZoombarComponent', () => {
  let component: ZoombarComponent;
  let fixture: ComponentFixture<ZoombarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZoombarComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoombarComponent);
    component = fixture.componentInstance;
    component.state = new AppState();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide the token focus button without a user token', () => {
    expect(component.tokenFocusVisible).toBe(false);
  });

  it('should show the token focus button for a signed-in player\'s character', () => {
    component.state.map = minimalMap({ tokens: [minimalToken({ id: "token-1", entityId: "hero" })] });
    component.state.tokenControl = { playerId: "p1", characterIds: [] };
    expect(component.tokenFocusVisible).toBe(false);
    component.state.tokenControl = { playerId: "p1", characterIds: ["hero"] };
    expect(component.tokenFocusVisible).toBe(true);
  });
});
