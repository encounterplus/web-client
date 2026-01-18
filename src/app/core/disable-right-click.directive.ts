import { Directive, HostListener } from '@angular/core';

@Directive({
    selector: '[appDisableRightClick]',
    standalone: false
})
export class DisableRightClickDirective {
  @HostListener('contextmenu', ['$event'])
  onRightClick(event) {
    event.preventDefault();
  }
}
