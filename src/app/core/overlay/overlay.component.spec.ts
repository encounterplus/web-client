import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Screen, emptyScreen } from 'src/app/shared/models/screen';

import { OverlayComponent } from './overlay.component';

describe('OverlayComponent', () => {
  let component: OverlayComponent;
  let fixture: ComponentFixture<OverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverlayComponent ],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayComponent);
    component = fixture.componentInstance;

    const screen = emptyScreen();
    screen.overlayHandoutStyle = "parchment";
    screen.overlayHandoutText = "You see a door.";
    component.screen = screen;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the handout text and style', () => {
    expect(component.text).toBe("You see a door.");
    expect(component.style).toBe("parchment");
  });
});
