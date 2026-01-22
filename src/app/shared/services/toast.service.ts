import { Injectable, signal, TemplateRef, WritableSignal } from '@angular/core';
import { Message } from '../models/message';
import { Utils } from '../utils';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<any[]>([])
  readonly toasts = this._toasts.asReadonly()

  show(textOrTpl: string | TemplateRef<any>, options: any = {}) {

    // this._toasts.push({ textOrTpl, ...options });

    this._toasts.update((value) => {
      return [...value, { id: Utils.generateUniqueId(), textOrTpl, ...options }]
    })
  }

  showSuccess(text: string, autohide: boolean = true) {
    this.show(text, { classname: 'bg-success text-light', delay: 5000, autohide: autohide });
  }

  showError(text: string, autohide: boolean = true) {
    this.show(text, { classname: 'bg-danger text-light', delay: 5000, autohide: autohide });
  }

  showMessage(message: Message) {
    this.show(message.content, { classname: 'bg-info text-light', delay: 5000, autohide: true });
  }

  clear() {
    // this.toasts = [];
    this._toasts.update((value) => [])
  }

  remove(toast) {
    // this.toasts = this.toasts.filter(t => t !== toast);
    this._toasts.update(toasts => toasts.filter(t => t != toast));
  }
}