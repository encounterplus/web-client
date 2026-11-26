import { EventEmitter, Injectable } from '@angular/core';
import { ApiData } from '../models/api-data';
import { Observable, Subject, BehaviorSubject, timer, throwError, Subscription } from 'rxjs';
import { catchError, skip, filter, tap, distinctUntilChanged, switchMap, retryWhen, repeat, retry } from 'rxjs/operators';
import { WSEvent } from '../models/wsevent';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { webSocket } from 'rxjs/webSocket';
import { AppState } from '../models/app-state';
import type { Token } from '../models/token';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // hmm, global state?
  state: AppState = new AppState()

  private reconnectionDelay = 1000;
  public remoteHost: string = ""
  public protocol: string = ""

  /** The access token REST requests send, set by `SessionService`; `null` for a guest. */
  public accessToken: string | null = null

  /** The `Authorization` header for REST requests, empty for a guest. */
  get authHeaders(): HttpHeaders {
    return this.accessToken ? new HttpHeaders({ Authorization: `Bearer ${this.accessToken}` }) : new HttpHeaders()
  }

  private videoPaused$ = new BehaviorSubject(false);
  private videoMuted$ = new BehaviorSubject(true);

  videoPaused = this.videoPaused$.asObservable();
  videoMuted = this.videoMuted$.asObservable();

  /** A token whose entity page, such as its stat block, was asked for; the app decides whether it opens. */
  public showEntityEmitter = new EventEmitter<Token>();

  updateVideoPaused(value: boolean) {
    this.videoPaused$.next(value);
  }

  updateVideoMuted(value: boolean) {
    this.videoMuted$.next(value);
  }

  constructor(private httpClient: HttpClient) { 
  }

  get baseURL(): string {
    return `${this.protocol}//${this.remoteHost}`
  }

  /**
   * A page on the app's server, such as an entity's view or a character's sheet, for a browser to
   * open. A client served from elsewhere passes its access token in the fragment, which never
   * reaches a server: the page is on the app's origin, where the client's storage isn't, and the
   * sheet SDK keeps the token and takes it out of the address. A client the app served shares the
   * origin, and the page finds the token stored. An absolute address is taken as it is.
   */
  pageUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) {
      return path
    }
    const address = `${this.baseURL}${path.startsWith('/') ? '' : '/'}${path}`
    const token = this.accessToken
    if (!token || this.remoteHost === window.location.host) {
      return address
    }
    return `${address}${address.includes('#') ? '&' : '#'}accessToken=${encodeURIComponent(token)}`
  }

  get apiBaseURL(): string {
    return `${this.protocol}//${this.remoteHost}/api`
  }

  get wsBaseURL(): string {
    if (this.protocol == "https:") {
      return `wss://${this.remoteHost}/ws`
    } else {
      return `ws://${this.remoteHost}/ws`
    }
  }

  handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side errors
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side errors
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(errorMessage);
  }

  public getData(): Observable<ApiData> {
    return this.httpClient.get<ApiData>(this.apiBaseURL, { headers: this.authHeaders }).pipe(retry(1), catchError(this.handleError));
  }

  private status$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public attemptNr: number = 0;
  private ws: any;
  private wsSubscription: Subscription | undefined;
  public events$: Subject<WSEvent> = new Subject<WSEvent>();

  public get connectionStatus$(): Observable<boolean> {
    return this.status$.pipe(distinctUntilChanged());
  }

  public connect() {
    this.create();
    this.connectionStatus$.pipe(
      skip(1),
      filter(status => !status),
      tap(() => this.create()),
    ).subscribe();
  }

  private create() {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.ws) {
      this.ws.unsubscribe();
    }
    const retryConnection = switchMap(() => {
      this.status$.next(false);
      this.attemptNr = this.attemptNr + 1;

      let delay = this.reconnectionDelay * Math.min(this.attemptNr * 2, 30);

      console.log(`Connection down (${this.wsBaseURL}), will attempt ${this.attemptNr} reconnection in ${delay}ms`);
      return timer(delay);
    });

    const openObserver = {
      next: () => this.status$.next(true),
      error: (err: any) => console.error('WebSocket open error:', err),
      complete: () => {}
    };
    
    const closeObserver = {
      next: () => this.status$.next(false),
      error: (err: any) => console.error('WebSocket close error:', err),
      complete: () => {}
    };
    
    this.ws = webSocket<any>({
      url: this.wsBaseURL,
      openObserver,
      closeObserver,
    });

    this.wsSubscription = this.ws.pipe(retryWhen((errs) => errs.pipe(retryConnection, repeat()))).subscribe(this.events$);
  }

  public send(event: WSEvent) {
    this.ws.next(event);
  }

  public showEntity(token: Token) {
    this.showEntityEmitter.emit(token)
  }
}

export function deepMerge<T>(target: T, patch: Partial<T>): T {
  if (patch === null || patch === undefined) {
    return target;
  }

  // If patch is not an object, replace entirely
  if (typeof patch !== 'object' || Array.isArray(patch)) {
    return patch as T;
  }

  // Merge objects deeply
  const result: any = Array.isArray(target) ? [...target] : { ...target };

  for (const key of Object.keys(patch)) {
    const value = (patch as any)[key];

    if (value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)) {
      result[key] = deepMerge((target as any)[key], value);
    } else {
      result[key] = value;
    }
  }

  return result;
}


