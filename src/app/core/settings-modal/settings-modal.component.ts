import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'ngbd-modal-basic',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent implements OnInit {

  remoteHost: string;

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { }

  save() {
    console.log(this.remoteHost);
    this.dataService.remoteHost = this.remoteHost;
    this.modalInstance.close("Close");
  }

  ngOnInit() {
    this.remoteHost = this.dataService.remoteHost;
  }
}
