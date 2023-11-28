import { Component, Input, OnInit, Output } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-entity-modal',
  templateUrl: './entity-modal.component.html',
  styleUrls: ['./entity-modal.component.scss']
})
export class EntityModalComponent implements OnInit {

  @Input() 
  reference: string;

  get url() {
    return `http://localhost:8080${this.reference}`
  }

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
    // this.reference = "/monster/goblin"
  }

  ngOnInit(): void {
  }
}
