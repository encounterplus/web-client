import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CombatantComponent } from './combatant.component';

describe('CombatantComponent', () => {
  let component: CombatantComponent;
  let fixture: ComponentFixture<CombatantComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CombatantComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CombatantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
