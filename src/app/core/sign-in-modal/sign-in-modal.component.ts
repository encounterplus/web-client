import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SessionService } from 'src/app/shared/services/session.service';

/**
 * Signing in with the code the GM gives each player. Closes with `signedIn`, or `guest` when the
 * user continues without signing in — offered only when the app lets guests in.
 */
@Component({
    selector: 'ngbd-modal-basic',
    templateUrl: './sign-in-modal.component.html',
    styleUrls: ['./sign-in-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SignInModalComponent {

  code = ''

  readonly busy = signal(false)
  readonly error = signal<string | null>(null)

  constructor(public modalInstance: NgbActiveModal, public session: SessionService) {
  }

  async signIn() {
    const code = this.code.trim()
    if (!code || this.busy()) {
      return
    }
    this.busy.set(true)
    this.error.set(null)
    try {
      await this.session.signIn(code)
      this.modalInstance.close('signedIn')
    } catch (error) {
      this.error.set((error as Error).message)
    } finally {
      this.busy.set(false)
    }
  }

  continueAsGuest() {
    this.session.skipSignIn()
    this.modalInstance.close('guest')
  }
}
