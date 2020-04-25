import { Injectable } from '@angular/core';
import { Subject, Observable, Observer } from 'rxjs';
import { WSEvent } from '../models/wsevent';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  private subject: Subject<WSEvent>;

  public connect(url): Subject<WSEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      console.log("Successfully connected: " + url);
    }
    return this.subject;
  }

  public send(event: WSEvent) {
    this.subject.next(event);
  }

  private create(url): Subject<WSEvent> {
    let ws = new WebSocket(url);

    let observable = Observable.create((obs: Observer<WSEvent>) => {
      ws.onmessage = obs.next.bind(obs);
      ws.onerror = obs.error.bind(obs);
      ws.onclose = obs.complete.bind(obs);
      return ws.close.bind(ws);
    });
    let observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };
    return Subject.create(observer, observable);
  }
}
