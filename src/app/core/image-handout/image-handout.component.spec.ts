import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { ImageHandoutComponent } from './image-handout.component';

describe('ImageHandoutComponent', () => {
  let component: ImageHandoutComponent;
  let fixture: ComponentFixture<ImageHandoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageHandoutComponent ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImageHandoutComponent);
    component = fixture.componentInstance;
    component.overlayImage = "http://example.com/handout.png";
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use absolute overlay urls as they are', () => {
    expect(component.image).toBe("http://example.com/handout.png");
  });
});
