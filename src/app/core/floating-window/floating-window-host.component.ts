import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { FloatingWindowService } from './floating-window.service';

/**
 * The layer the floating windows open on: the whole page, above the map and the side bars and
 * below modal dialogs, taking pointers only where a window is.
 */
@Component({
  selector: 'app-floating-window-host',
  template: `
    @for (win of windows.windows(); track win.key) {
      <app-floating-window [win]="win"></app-floating-window>
    }
  `,
  styleUrls: ['./floating-window-host.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class FloatingWindowHostComponent {
  constructor(public windows: FloatingWindowService) {}

  @HostListener('window:resize')
  onResize() {
    this.windows.viewportChanged(window.innerWidth, window.innerHeight)
  }
}
