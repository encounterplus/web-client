import { Injectable } from '@angular/core';
import { Subject, Observable, Observer, throwError, BehaviorSubject, timer } from 'rxjs';
import { WSEvent } from '../models/wsevent';
import { ToastService } from '../toast.service';
import { retryWhen, tap, delay, map, catchError, distinctUntilChanged, switchMap, repeat, skip, filter } from 'rxjs/operators';
import { webSocket } from "rxjs/webSocket";
import { DataService } from './data.service';

const reconnectionDelay = 5000;

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  get baseURL(): string {
    return 'ws://' + this.ds.remoteHost + '/ws'
  }

  constructor(private ds: DataService, private ts: ToastService) { 
    this.create();
    this.connectionStatus$.pipe(
      skip(1),
      filter(status => !status),
      tap(() => this.create()),
    ).subscribe();
  }

  private status$: Subject<boolean> = new BehaviorSubject<boolean>(false);
  private attemptNr: number = 0;
  private ws: any;
  public events$: Subject<WSEvent> = new Subject<WSEvent>();

  public get connectionStatus$(): Observable<boolean> {
    return this.status$.pipe(distinctUntilChanged());
  }

  private create() {
    if (this.ws) {
      this.ws.unsubscribe();
    }
    const retryConnection = switchMap(() => {
      this.status$.next(false);
      this.attemptNr = this.attemptNr + 1;

      // this.ts.showError(`Websocket connection error (${this.baseURL}) will attempt ${this.attemptNr} reconnection in ${reconnectionDelay}ms`);
      console.log(`Connection down (${this.baseURL}), will attempt ${this.attemptNr} reconnection in ${reconnectionDelay}ms`);

      return timer(reconnectionDelay);
    });

    const openObserver = new Subject<Event>();
    openObserver.pipe(map((_) => true)).subscribe(this.status$);
    const closeObserver = new Subject<CloseEvent>();
    closeObserver.pipe(map((_) => false)).subscribe(this.status$);
    this.ws = webSocket<any>({
      url: this.baseURL,
      openObserver,
      closeObserver,
    });

    this.ws.pipe(retryWhen((errs) =>
      errs.pipe(retryConnection,
        repeat()))).subscribe(this.events$);
  }

  public send(event: WSEvent) {
    this.events$.next(event);
  }
}