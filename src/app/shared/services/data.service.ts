import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ApiData } from '../models/api-data';
import { Observable, Subject } from 'rxjs';
import { WebsocketService} from './websocket.service';
import { map, catchError } from 'rxjs/operators';
import { WSEvent } from '../models/wsevent';
import { Loader } from 'src/app/core/map/models/loader';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // public events: Subject<WSEvent>;

  public remoteHost: string

  constructor() { 

    this.remoteHost = "192.168.1.168:8080";
    Loader.shared.remoteBaseURL = `http://${this.remoteHost}`;

  //   // return;
    
  //   this.events = <Subject<WSEvent>>ws
	// 		.connect(this.wsURL);
	// }

  }

  // // Simulate GET /todos
  // getData(): Observable<ApiData> {
  //   return this.api.getData()
  // }

  // public send(event: WSEvent) {
  //   this.events.next(event);
  // }
}
