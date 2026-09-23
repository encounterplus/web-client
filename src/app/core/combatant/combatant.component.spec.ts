import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
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
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombatantComponent);
    component = fixture.componentInstance;

    const combatant = new Combatant();
    combatant.id = "1";
    combatant.name = "Goblin";
    combatant.label = "Goblin 1";
    combatant.role = Role.hostile;
    combatant.entityType = "Monster";
    component.combatant = combatant;

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
