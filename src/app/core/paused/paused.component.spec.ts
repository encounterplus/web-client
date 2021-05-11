import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PausedComponent } from './paused.component';

describe('PausedComponent', () => {
  let component: PausedComponent;
  let fixture: ComponentFixture<PausedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PausedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PausedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
