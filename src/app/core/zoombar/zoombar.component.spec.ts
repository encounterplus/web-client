import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoombarComponent } from './zoombar.component';

describe('ZoombarComponent', () => {
  let component: ZoombarComponent;
  let fixture: ComponentFixture<ZoombarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZoombarComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoombarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
