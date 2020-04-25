import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ApiData } from '../models/api-data';
import { Observable, Subject } from 'rxjs';
import { WebsocketService} from './websocket.service';
import { map } from 'rxjs/operators';
import { WSEvent } from '../models/wsevent';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public events: Subject<WSEvent>;

  constructor(private api: ApiService, private ws: WebsocketService) { 
    
    this.events = <Subject<WSEvent>>ws
			.connect(this.wsURL)
			.pipe(map((response: WSEvent): any => {
				return JSON.parse(response.data);
      }));
	}

  get baseURL(): string {
    return this.api.remoteBaseURL
  }

  get wsURL(): string {
    return 'ws://' + this.api.remoteHost + '/ws'
  }

  // Simulate GET /todos
  getData(): Observable<ApiData> {
    return this.api.getData()
  }

  public send(event: WSEvent) {
    this.events.next(event);
  }
}
