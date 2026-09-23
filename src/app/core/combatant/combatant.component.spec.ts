import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Combatant, Role } from 'src/app/shared/models/combatant';

import { CombatantComponent } from './combatant.component';

describe('CombatantComponent', () => {
  let component: CombatantComponent;
  let fixture: ComponentFixture<CombatantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CombatantComponent ],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombatantComponent);
    component = fixture.componentInstance;

    component.combatant = {
      id: "1",
      name: "Goblin",
      label: "Goblin 1",
      role: Role.hostile,
      entityType: "Monster",
    } as Combatant;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should use the label for non-characters', () => {
    expect(component.name).toBe("Goblin 1");
  });

  it('should fall back to the placeholder image', () => {
    expect(component.image).toBe("assets/img/creature.png");
  });
});
