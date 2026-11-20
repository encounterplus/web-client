import { Component, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-entity-modal',
    templateUrl: './entity-modal.component.html',
    styleUrls: ['./entity-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EntityModalComponent implements OnInit {

  @Input() 
  reference!: string;

  /**
   * The entry's address on the app's server: its rendered view, or its sheet when its type opens as
   * one. A client served from elsewhere passes its access token in the fragment, which never reaches
   * a server: the page is on the app's origin, where the client's storage isn't, and the sheet SDK
   * keeps the token and takes it out of the address. A client the app served shares the origin, and
   * the page finds the token stored.
   */
  get url() {
    const address = `${this.dataService.baseURL}${this.reference}`
    const token = this.dataService.accessToken
    if (!token || this.dataService.remoteHost === window.location.host) {
      return address
    }
    return `${address}${address.includes('#') ? '&' : '#'}accessToken=${encodeURIComponent(token)}`
  }

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
    // this.reference = "/monster/goblin"
  }

  ngOnInit(): void {
  }
}
