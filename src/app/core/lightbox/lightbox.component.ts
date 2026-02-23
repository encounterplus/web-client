import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-lightbox',
  templateUrl: './lightbox.component.html',
  styleUrls: ['./lightbox.component.scss'],
  standalone: false
})
export class LightboxComponent {
  @Input() isOpen = false;
  @Input() imageUrl: string = '';
  @Input() imageAlt: string = 'Lightbox image';

  @Output() close = new EventEmitter<void>();

  onBackdropClick(): void {
    this.close.emit();
  }

  onImageClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onCloseButtonClick(): void {
    this.close.emit();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close.emit();
    }
  }
}
