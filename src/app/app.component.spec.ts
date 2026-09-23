import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AppState } from './shared/models/app-state';
import { DataService } from './shared/services/data.service';
import { WSEvent } from './shared/models/wsevent';

// the real service opens a websocket on init, so the spec runs against a stub
function dataServiceStub() {
  return {
    state: new AppState(),
    remoteHost: "localhost",
    protocol: "http:",
    attemptNr: 0,
    baseURL: "http://localhost",
    events$: new Subject<WSEvent>(),
    // never emits, so neither the connected nor the disconnected branch runs
    connectionStatus$: new Subject<boolean>(),
    showEntityEmitter: new EventEmitter<string>(),
    connect: jasmine.createSpy('connect'),
    send: jasmine.createSpy('send'),
    getData: jasmine.createSpy('getData').and.returnValue(EMPTY)
  };
}

describe('AppComponent', () => {
  let dataService: ReturnType<typeof dataServiceStub>;

  beforeEach(async () => {
    dataService = dataServiceStub();

    await TestBed.configureTestingModule({
      declarations: [
        AppComponent
      ],
      providers: [
        { provide: DataService, useValue: dataService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'external-screen'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('external-screen');
  });

  it('should start with a fresh app state', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.state).toBeTruthy();
    expect(app.state.messages).toEqual([]);
  });

  it('should connect the websocket on init', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    expect(dataService.connect).toHaveBeenCalled();
  });
});
