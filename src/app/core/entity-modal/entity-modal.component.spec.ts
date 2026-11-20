import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SafePipe } from 'safe-pipe';

import { DataService } from 'src/app/shared/services/data.service';
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
        provideHttpClient(withXhr()),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    // the server the client is connected to, never a fixed address
    const dataService = TestBed.inject(DataService);
    dataService.protocol = "http:";
    dataService.remoteHost = "192.168.1.42:8080";

    fixture = TestBed.createComponent(EntityModalComponent);
    component = fixture.componentInstance;
    component.reference = "/monster/goblin";
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should build the entity url from the connected server and the reference', () => {
    expect(component.url).toBe("http://192.168.1.42:8080/monster/goblin");
  });

  it('passes the access token in the fragment to a page on another origin', () => {
    TestBed.inject(DataService).accessToken = "ept_alice";
    expect(component.url).toBe("http://192.168.1.42:8080/monster/goblin#accessToken=ept_alice");
  });

  it('leaves the token out for a page on its own origin, which finds it stored', () => {
    const dataService = TestBed.inject(DataService);
    dataService.accessToken = "ept_alice";
    dataService.remoteHost = window.location.host;
    expect(component.url).toBe(`http://${window.location.host}/monster/goblin`);
  });
});
