import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { throwError } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';
import { ApiData } from './shared/models/api-data';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  public remoteHost: string
  
  get remoteBaseURL(): string {
    return `http://${this.remoteHost}`
  }

  get remoteBaseApiURL(): string {
    return `${this.remoteBaseURL}/api/v1`
  }

  constructor(private httpClient: HttpClient) { 
    this.remoteHost = 'localhost:8080'
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
    window.alert(errorMessage);
    return throwError(errorMessage);
  }

  public getData(){
    return this.httpClient.get<ApiData>(this.remoteBaseApiURL).pipe(retry(3), catchError(this.handleError));
  }
}
