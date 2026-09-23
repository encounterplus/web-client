import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SafePipe } from 'safe-pipe';

import { EntityModalComponent } from './entity-modal.component';

describe('EntityModalComponent', () => {
  let component: EntityModalComponent;
  let fixture: ComponentFixture<EntityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EntityModalComponent ],
      imports: [ SafePipe ],
      providers: [
        NgbActiveModal,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntityModalComponent);
    component = fixture.componentInstance;
    component.reference = "/monster/goblin";
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the entity url from the reference', () => {
    expect(component.url).toBe("http://localhost:8080/monster/goblin");
  });
});
