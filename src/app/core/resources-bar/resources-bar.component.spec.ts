import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesBarComponent } from './resources-bar.component';
import { DataService } from 'src/app/shared/services/data.service';
import { GameResource } from 'src/app/shared/models/game';

function resource(overrides: Partial<GameResource> = {}): GameResource {
  return { id: "fear", type: "counter", label: "Fear", min: 0, value: 3, ...overrides }
}

describe('ResourcesBarComponent', () => {
  let component: ResourcesBarComponent;
  let fixture: ComponentFixture<ResourcesBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResourcesBarComponent],
      providers: [{ provide: DataService, useValue: { baseURL: "http://localhost" } }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcesBarComponent);
    component = fixture.componentInstance;
  });

  function render(resources: Array<GameResource>): HTMLElement {
    fixture.componentRef.setInput('resources', resources);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('shows the value, the maximum and the label', () => {
    const element = render([resource({ max: 12 })]);
    expect(element.querySelector('.value')?.textContent).toBe("3");
    expect(element.querySelector('.max')?.textContent).toBe("/ 12");
    expect(element.querySelector('.label')?.textContent).toBe("Fear");
  });

  it('leaves out the maximum when there is none', () => {
    const element = render([resource()]);
    expect(element.querySelector('.max')).toBeNull();
  });

  it('draws a game icon as a glyph and no icon as nothing', () => {
    const element = render([resource({ icon: "gi-skull" }), resource({ id: "hope", icon: undefined })]);
    expect(element.querySelectorAll('.glyph').length).toBe(1);
    expect(element.querySelector('.image')).toBeNull();
  });

  it('loads an image icon from the server', () => {
    const element = render([resource({ icon: "systems/daggerheart/icons/fear.png" })]);
    expect(element.querySelector('img')?.getAttribute('src')).toBe("http://localhost/systems/daggerheart/icons/fear.png");
  });

  it('shows one item per resource, in order', () => {
    const element = render([resource(), resource({ id: "hope", label: "Hope" })]);
    const labels = Array.from(element.querySelectorAll('.label')).map(label => label.textContent);
    expect(labels).toEqual(["Fear", "Hope"]);
  });
});
