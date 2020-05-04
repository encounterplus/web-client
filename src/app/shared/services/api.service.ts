import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';
import { ApiData } from '../models/api-data';
import { retry, catchError } from 'rxjs/operators';
import { Loader } from 'src/app/core/map/models/loader';
import { ToastService } from '../toast.service';
import { DataService } from './data.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  get baseURL(): string {
    return `http://${this.ds.remoteHost}/api`
  }

  constructor(private httpClient: HttpClient, private ds: DataService, private ts: ToastService) { 
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
    // window.alert(errorMessage);
    // this.ts.showError(errorMessage);
    // this.ts.showError("test");
    return throwError(errorMessage);
    // return this;
  }

  public getData(): Observable<ApiData> {
    return this.httpClient.get<ApiData>(this.baseURL).pipe(retry(1), catchError(this.handleError));
  }
}
