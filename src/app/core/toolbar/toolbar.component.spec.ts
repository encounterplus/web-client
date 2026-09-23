import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AppState } from 'src/app/shared/models/app-state';

import { ToolbarComponent, Tool } from './toolbar.component';

describe('ToolbarComponent', () => {
  let component: ToolbarComponent;
  let fixture: ComponentFixture<ToolbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ToolbarComponent ],
      imports: [ FormsModule, NgbDropdownModule ],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ToolbarComponent);
    component = fixture.componentInstance;
    component.state = new AppState();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with the move tool', () => {
    expect(component.activeTool).toBe(Tool.move);
  });

  it('should emit the selected tool', () => {
    const emitted: Array<Tool> = [];
    component.tool.subscribe(tool => emitted.push(tool));
    component.activeToolChanged(Tool.pointer);
    expect(emitted).toEqual([Tool.pointer]);
  });
});
