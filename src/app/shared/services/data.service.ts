import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ApiData } from '../models/api-data';
import { Observable, Subject } from 'rxjs';
import { WebsocketService, WSEvent } from './websocket.service';
import { map } from 'rxjs/operators';

const CHAT_URL = "ws://localhost:8080/ws";

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public events: Subject<WSEvent>;

  constructor(private api: ApiService, private ws: WebsocketService) { 
    
    this.events = <Subject<WSEvent>>ws
			.connect(CHAT_URL)
			.pipe(map((response: WSEvent): any => {
				return JSON.parse(response.data);
			}));
	}

  get baseURL(): string {
    return this.api.remoteBaseURL
  }

  // Simulate GET /todos
  getData(): Observable<ApiData> {
    return this.api.getData()
  }

  public send(event: WSEvent) {
    this.events.next(event);
  }
}
