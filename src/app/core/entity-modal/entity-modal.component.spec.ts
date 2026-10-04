import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SafePipe } from 'safe-pipe';

import { EntityModalComponent } from './entity-modal.component';
import { DataService } from 'src/app/shared/services/data.service';

describe('EntityModalComponent', () => {
  let component: EntityModalComponent;
  let fixture: ComponentFixture<EntityModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EntityModalComponent],
      imports: [SafePipe],
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EntityModalComponent);
    component = fixture.componentInstance;
    const dataService = TestBed.inject(DataService);
    dataService.protocol = 'http:';
    dataService.remoteHost = 'localhost:8080';
    component.reference = '/monster/goblin';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the entity url from the reference', () => {
    expect(component.url).toBe('http://localhost:8080/monster/goblin');
  });

  it('removes the loading overlay when a cross-origin document is inaccessible', () => {
    const frame = document.createElement('iframe');
    spyOnProperty(frame, 'contentDocument', 'get').and.returnValue(null);
    component.frameLoading = true;
    component.frameLoaded(frame);
    expect(component.frameLoading).toBeFalse();
  });
});
