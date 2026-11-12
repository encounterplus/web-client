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

  /** The entry's address on the app's server: its rendered view, or its sheet when its type opens as one. */
  get url() {
    return `${this.dataService.baseURL}${this.reference}`
  }

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
    // this.reference = "/monster/goblin"
  }

  ngOnInit(): void {
  }
}
