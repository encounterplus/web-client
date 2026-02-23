import { Component } from '@angular/core';
import { LightboxService } from './lightbox.service';

@Component({
  selector: 'app-lightbox',
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss'],
  standalone: false
})
export class LightboxComponent {
  public lightboxState$ = this.lightboxService.state$;

  constructor(private lightboxService: LightboxService) {}

  onBackdropClick(): void {
    this.lightboxService.close();
  }

  onImageClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onCloseButtonClick(): void {
    this.lightboxService.close();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.lightboxService.close();
    }
  }
}
