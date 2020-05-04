import { Injectable, TemplateRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: any[] = [];

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {
    this.toasts.push({ textOrTpl, ...options });
  }

  showSuccess(text: string, autohide: boolean = true) {
    this.show(text, { classname: 'bg-success text-light', delay: 5000, autohide: autohide });
  }

  showError(text: string, autohide: boolean = true) {
    this.show(text, { classname: 'bg-danger text-light', delay: 5000, autohide: autohide });
  }

  clear() {
    this.toasts = [];
  }

  remove(toast) {
    this.toasts = this.toasts.filter(t => t !== toast);
  }
}