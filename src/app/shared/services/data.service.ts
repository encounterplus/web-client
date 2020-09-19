import { Injectable } from '@angular/core';
import { ApiData } from '../models/api-data';
import { Observable, Subject, BehaviorSubject, timer, throwError } from 'rxjs';
import { map, catchError, skip, filter, tap, distinctUntilChanged, switchMap, retryWhen, repeat, retry } from 'rxjs/operators';
import { WSEvent } from '../models/wsevent';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { webSocket } from 'rxjs/webSocket';
import { AppState } from '../models/app-state';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // hmm, global state?
  state: AppState;

  private reconnectionDelay = 1000;
  public remoteHost: string;
  public protocol: string;

  private videoPaused$ = new BehaviorSubject(false);
  private videoMuted$ = new BehaviorSubject(true);

  videoPaused = this.videoPaused$.asObservable();
  videoMuted = this.videoMuted$.asObservable();

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
    return this.httpClient.get<ApiData>(this.apiBaseURL).pipe(retry(1), catchError(this.handleError));
  }

  private status$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  public attemptNr: number = 0;
  private ws: any;
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

    const openObserver = new Subject<Event>();
    openObserver.pipe(map((_) => true)).subscribe(this.status$);
    const closeObserver = new Subject<CloseEvent>();
    closeObserver.pipe(map((_) => false)).subscribe(this.status$);
    this.ws = webSocket<any>({
      url: this.wsBaseURL,
      openObserver,
      closeObserver,
    });

    this.ws.pipe(retryWhen((errs) => errs.pipe(retryConnection, repeat()))).subscribe(this.events$);
  }

  public send(event: WSEvent) {
    this.ws.next(event);
  }
}
