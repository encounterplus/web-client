import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';
import { SessionService, ServerInfo } from './session.service';
import { DataService } from './data.service';
import { WSEvent, WSEventName } from '../models/wsevent';

const server: ServerInfo = { id: 'server-1', version: '5.0', auth: { guest: 'view' } };

/** A data service whose socket the test answers: `sent` collects what goes out. */
function dataStub() {
  const events$ = new Subject<WSEvent>();
  const sent: WSEvent[] = [];
  return {
    remoteHost: 'localhost:8080',
    protocol: 'http:',
    apiBaseURL: 'http://localhost:8080/api',
    accessToken: null as string | null,
    events$,
    sent,
    send: (event: WSEvent) => sent.push(event),
    /** Answers the last request sent. */
    answer(name: WSEventName, data: any) {
      events$.next({ name, data, responseId: sent[sent.length - 1].requestId });
    }
  };
}

describe('SessionService', () => {
  let service: SessionService;
  let http: HttpTestingController;
  let data: ReturnType<typeof dataStub>;

  beforeEach(() => {
    localStorage.removeItem('encounterplus.accessTokens');
    localStorage.removeItem('encounterplus.accessToken');
    localStorage.removeItem('encounterplus.signInSkipped');
    data = dataStub();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: DataService, useValue: data }
      ]
    });
    service = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function loadServer(info: ServerInfo | null = server) {
    const loading = service.loadServer();
    const request = http.expectOne('http://localhost:8080/api/server');
    if (info) {
      request.flush(info);
    } else {
      request.flush('Not found', { status: 404, statusText: 'Not Found' });
    }
    await loading;
  }

  async function signIn(code = 'ABC-DEF', token = 'ept_alice') {
    const signingIn = service.signIn(code);
    const request = http.expectOne('http://localhost:8080/api/session');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ code });
    request.flush({ accessToken: token, role: 'player', permissions: ['read', 'write'], name: 'Alice', player: { id: 'p1', name: 'Alice' } }, { status: 201, statusText: 'Created' });
    return signingIn;
  }

  it('knows an app with sign-in by its answer, and one without by anything else', async () => {
    await loadServer();
    expect(service.supportsSignIn()).toBeTrue();
    expect(service.allowsGuests()).toBeTrue();

    await loadServer(null);
    expect(service.supportsSignIn()).toBeFalse();
  });

  it('an app that lets no guest in asks everyone to sign in', async () => {
    await loadServer({ ...server, auth: { guest: 'none' } });
    expect(service.allowsGuests()).toBeFalse();
  });

  it('signing in keeps the token for this server, and REST requests send it', async () => {
    await loadServer();
    const session = await signIn();
    expect(session.role).toBe('player');
    expect(service.session()?.name).toBe('Alice');
    expect(service.isSignedIn()).toBeTrue();
    expect(service.accessToken).toBe('ept_alice');
    expect(data.accessToken).toBe('ept_alice');
    expect(JSON.parse(localStorage.getItem('encounterplus.accessTokens')!)).toEqual({ 'server-1': 'ept_alice' });
  });

  it('a wrong code says so, for people', async () => {
    await loadServer();
    const signingIn = service.signIn('ZZZ-ZZZ');
    http.expectOne('http://localhost:8080/api/session').flush('no', { status: 401, statusText: 'Unauthorized' });
    await expectAsync(signingIn).toBeRejectedWithError("That code isn't valid.");
    expect(service.isSignedIn()).toBeFalse();
  });

  it('too many attempts say so', async () => {
    await loadServer();
    const signingIn = service.signIn('ZZZ-ZZZ');
    http.expectOne('http://localhost:8080/api/session').flush('slow down', { status: 429, statusText: 'Too Many Requests' });
    await expectAsync(signingIn).toBeRejectedWithError('Too many attempts. Try again in a minute.');
  });

  it('the socket signs in with the kept token before anything else', async () => {
    await loadServer();
    await signIn();
    service.session.set(null);

    const authenticating = service.authenticateSocket();
    expect(data.sent.length).toBe(1);
    expect(data.sent[0].name).toBe(WSEventName.authenticate);
    expect(data.sent[0].data).toEqual({ accessToken: 'ept_alice' });
    data.answer(WSEventName.authenticated, { role: 'player', permissions: ['read', 'write'], name: 'Alice' });

    expect(await authenticating).toEqual({ refused: false });
    expect(service.session()?.role).toBe('player');
  });

  it('a kept token the app refuses is forgotten, and the client is a guest', async () => {
    await loadServer();
    await signIn();

    const authenticating = service.authenticateSocket();
    data.answer(WSEventName.requestFailed, { code: 'unauthenticated', message: 'not valid' });

    expect(await authenticating).toEqual({ refused: true });
    expect(service.isSignedIn()).toBeFalse();
    expect(service.accessToken).toBeNull();
    expect(data.accessToken).toBeNull();
  });

  it('without a kept token, or with an app without sign-in, nothing is sent', async () => {
    await loadServer();
    expect(await service.authenticateSocket()).toEqual({ refused: false });
    await loadServer(null);
    expect(await service.authenticateSocket()).toEqual({ refused: false });
    expect(data.sent.length).toBe(0);
  });

  it('takes the session the app sends a signed-in player, but not after signing out', () => {
    service.updated({ role: 'player', permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice' }, characters: [] });
    expect(service.session()).toBeNull();

    service.session.set({ role: 'player', permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice' }, characters: [] });
    const hero = { id: 'hero', name: 'Hero', kind: 'Character' };
    service.updated({ role: 'player', permissions: ['read', 'write'], player: { id: 'p1', name: 'Alice' }, characters: [hero] });
    expect(service.session()?.characters).toEqual([hero]);
  });

  it('signing out asks the app to forget the token, and forgets it too', async () => {
    await loadServer();
    await signIn();

    const signingOut = service.signOut();
    const request = http.expectOne('http://localhost:8080/api/session');
    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('Authorization')).toBe('Bearer ept_alice');
    request.flush(null, { status: 204, statusText: 'No Content' });
    await signingOut;

    expect(service.isSignedIn()).toBeFalse();
    expect(service.accessToken).toBeNull();
  });

  it('continuing as a guest is remembered per server, and signing in clears it', async () => {
    await loadServer();
    expect(service.skippedSignIn).toBeFalse();
    service.skipSignIn();
    expect(service.skippedSignIn).toBeTrue();

    await signIn();
    expect(service.skippedSignIn).toBeFalse();
  });

  it('a client served by the app shares its token with the sheets on its origin', async () => {
    data.remoteHost = window.location.host;
    await loadServer();
    await signIn();
    expect(localStorage.getItem('encounterplus.accessToken')).toBe('ept_alice');

    const signingOut = service.signOut();
    http.expectOne('http://localhost:8080/api/session').flush(null, { status: 204, statusText: 'No Content' });
    await signingOut;
    expect(localStorage.getItem('encounterplus.accessToken')).toBeNull();
  });

  it('a client served from elsewhere leaves the sheets\' token alone', async () => {
    await loadServer();
    await signIn();
    expect(localStorage.getItem('encounterplus.accessToken')).toBeNull();
  });
});
