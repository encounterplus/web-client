import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface LightboxState {
  isOpen: boolean;
  imageUrl: string;
  imageAlt: string;
}

@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  private readonly initialState: LightboxState = {
    isOpen: false,
    imageUrl: '',
    imageAlt: ''
  };

  private lightboxState$ = new BehaviorSubject<LightboxState>(this.initialState);

  public state$: Observable<LightboxState> = this.lightboxState$.asObservable();

  open(imageUrl: string, imageAlt: string = 'Custom Image'): void {
    this.lightboxState$.next({
      isOpen: true,
      imageUrl,
      imageAlt
    });
  }

  close(): void {
    this.lightboxState$.next({
      ...this.lightboxState$.value,
      isOpen: false
    });
    
    // Reset to initial state after animation completes
    setTimeout(() => {
      this.lightboxState$.next(this.initialState);
    }, 200);
  }

  getState(): LightboxState {
    return this.lightboxState$.value;
  }
}
