import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Combatant, Role } from 'src/app/shared/models/combatant';
import { fullCombatant, minimalCombatant } from 'src/app/shared/models/testing/fixtures';

import { CombatantComponent } from './combatant.component';

describe('CombatantComponent', () => {
  let component: CombatantComponent;
  let fixture: ComponentFixture<CombatantComponent>;

  /**
   * Renders a fresh fixture. Swapping the input on a fixture that has already been checked trips
   * NG0100, so a test that asserts on the DOM starts from a new one.
   */
  function render(combatant: Combatant): void {
    fixture = TestBed.createComponent(CombatantComponent);
    component = fixture.componentInstance;
    component.combatant = combatant;
    fixture.detectChanges();
  }

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

  describe('with a combatant that carries only its required fields', () => {

    beforeEach(() => {
      render(minimalCombatant());
    });

    it('renders without a name, an image or a role', () => {
      expect(component.name).toBe("");
      expect(component.image).toBe("assets/img/creature.png");
      expect(component.overlayImage).toBe("");
      expect(fixture.nativeElement.querySelector('h4').textContent).toBe("");
      expect(fixture.nativeElement.querySelector('.overlay-image')).toBeNull();
    });
  });

  describe('name', () => {

    it('uses the name for a character', () => {
      component.combatant = fullCombatant({ entityType: "Character" });
      expect(component.name).toBe("Goblin");
    });

    it('is empty for a character the server sent no name for', () => {
      component.combatant = minimalCombatant({ entityType: "Character" });
      expect(component.name).toBe("");
    });
  });

  describe('overlayImage', () => {

    it('shows the dead overlay ahead of the bloodied one', () => {
      render(minimalCombatant({ defeated: true, bloodied: true }));
      expect(component.overlayImage).toBe("assets/img/creature-dead.png");
      expect(fixture.nativeElement.querySelector('.overlay-image')).not.toBeNull();
    });

    it('shows the bloodied overlay on its own', () => {
      component.combatant = minimalCombatant({ bloodied: true });
      expect(component.overlayImage).toBe("assets/img/creature-bloodied.png");
    });
  });
});
