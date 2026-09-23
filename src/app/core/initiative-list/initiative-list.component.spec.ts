import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CombatantComponent } from '../combatant/combatant.component';

import { InitiativeListComponent } from './initiative-list.component';

describe('InitiativeListComponent', () => {
  let component: InitiativeListComponent;
  let fixture: ComponentFixture<InitiativeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InitiativeListComponent, CombatantComponent ],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InitiativeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render no combatants by default', () => {
    expect(fixture.nativeElement.querySelectorAll('app-combatant').length).toBe(0);
  });
});
