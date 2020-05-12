import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageHandoutComponent } from './image-handout.component';

describe('ImageHandoutComponent', () => {
  let component: ImageHandoutComponent;
  let fixture: ComponentFixture<ImageHandoutComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImageHandoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageHandoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
