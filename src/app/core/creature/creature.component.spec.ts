import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreatureComponent } from './creature.component';

describe('CreatureComponent', () => {
  let component: CreatureComponent;
  let fixture: ComponentFixture<CreatureComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreatureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
