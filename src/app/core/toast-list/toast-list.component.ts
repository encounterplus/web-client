import { Component, OnInit, TemplateRef, ChangeDetectionStrategy } from '@angular/core';
import { Toast, ToastService } from 'src/app/shared/services/toast.service';

@Component({
    selector: 'app-toast-list',
    templateUrl: './toast-list.component.html',
    styleUrls: ['./toast-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})

export class ToastListComponent {
  constructor(public toastService: ToastService) {}

  // A type guard, so the template can narrow textOrTpl before handing it to
  // ngTemplateOutlet.
  isTemplate(toast: Toast): toast is Toast & { textOrTpl: TemplateRef<any> } {
    return toast.textOrTpl instanceof TemplateRef;
  }
}
