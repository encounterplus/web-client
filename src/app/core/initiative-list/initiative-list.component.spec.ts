import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { CombatantComponent } from '../combatant/combatant.component';

import { InitiativeListComponent } from './initiative-list.component';
import { minimalActiveCombatant, minimalCombatant, minimalInitiative } from 'src/app/shared/models/testing/fixtures';
import { ActiveCombatant, Role } from 'src/app/shared/models/combatant';

describe('InitiativeListComponent', () => {
  let component: InitiativeListComponent;
  let fixture: ComponentFixture<InitiativeListComponent>;

  /**
   * Renders a fresh fixture. Swapping the input on a fixture that has already been checked trips
   * NG0100, so a test that asserts on the DOM starts from a new one.
   */
  function render(activeCombatants: Array<ActiveCombatant>): void {
    fixture = TestBed.createComponent(InitiativeListComponent);
    component = fixture.componentInstance;
    component.activeCombatants = activeCombatants;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    localStorage.clear();
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

  it('starts in the persisted dock position', () => {
    fixture.destroy();
    localStorage.setItem('initiativeDockPosition', 'bottom');

    fixture = TestBed.createComponent(InitiativeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.dockPosition).toBe('bottom');
    expect(fixture.nativeElement.querySelector('.initiative-dock-shell').classList).toContain('dock-bottom');
  });

  it('toggles directly between the right and bottom positions', () => {
    const event = jasmine.createSpyObj<Event>('event', ['preventDefault', 'stopPropagation']);
    const changed = jasmine.createSpy('changed');
    component.dockPositionChange.subscribe(changed);

    component.toggleDockPosition(event);
    expect(component.dockPosition).toBe('bottom');
    expect(localStorage.getItem('initiativeDockPosition')).toBe('bottom');
    expect(changed).toHaveBeenCalledWith('bottom');

    component.toggleDockPosition(event);
    expect(component.dockPosition).toBe('right');
    expect(localStorage.getItem('initiativeDockPosition')).toBe('right');
    expect(changed).toHaveBeenCalledWith('right');
  });

  describe('with combatants that carry only their required fields', () => {

    beforeEach(() => {
      render([
        minimalActiveCombatant({ id: "a", initiative: minimalInitiative({ id: "i-a" }) }),
        minimalActiveCombatant({ id: "b", initiative: minimalInitiative({ id: "i-b" }), turned: true }),
      ]);
    });

    it('renders one row per combatant', () => {
      expect(fixture.nativeElement.querySelectorAll('app-combatant').length).toBe(2);
    });

    it('marks the turned row and tags each row with its initiative id', () => {
      const rows = fixture.nativeElement.querySelectorAll('app-combatant');
      expect(rows[0].getAttribute('data-id')).toBe("i-a");
      expect(rows[1].classList).toContain('combatant-turned');
      expect(rows[0].classList).not.toContain('combatant-turned');
    });

    // the template interpolates the role straight into a class name, so a combatant the server
    // sent no role for lands on a bare `role-` that matches none of the role styles
    it('leaves a dangling role class for a combatant with no role', () => {
      const rows = fixture.nativeElement.querySelectorAll('app-combatant');
      expect(rows[0].classList).toContain('role-');
      expect(rows[0].className).not.toContain('role-undefined');
    });

    it('uses the role in the class when there is one', () => {
      render([minimalActiveCombatant({ combatant: minimalCombatant({ role: Role.hostile }) })]);
      expect(fixture.nativeElement.querySelector('app-combatant').className).toContain('role-hostile');
    });

    it('scrolls to the turned row without a match to scroll to', () => {
      expect(() => component.scrollToTurned("i-missing")).not.toThrow();
    });
  });
});
