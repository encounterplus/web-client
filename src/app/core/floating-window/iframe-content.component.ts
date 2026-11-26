import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A floating window's content that is a page of its own, such as a character sheet or a stat block. */
@Component({
  selector: 'app-iframe-content',
  template: `<iframe [src]="url() | safe: 'resourceUrl'" [title]="title()"></iframe>`,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    iframe { display: block; width: 100%; height: 100%; border: 0; }
  `],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false,
})
export class IframeContentComponent {
  readonly url = input.required<string>()
  readonly title = input('')
}
