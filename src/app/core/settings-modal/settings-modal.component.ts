import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEventName } from 'src/app/shared/models/wsevent';

@Component({
  selector: 'ngbd-modal-basic',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent implements OnInit {

  remoteHost: string;
  name: string;
  color: string;

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
    
  }

  save() {
    localStorage.setItem("userName", this.name);
    localStorage.setItem("userColor", this.color);

    this.dataService.send({name: WSEventName.clientUpdated, data: {name: this.name, color: this.color}});

    this.modalInstance.close("Close");

    // temporary hack
    if (this.remoteHost != this.dataService.remoteHost) {
      document.location.search = `?remoteHost=${this.remoteHost}`;
    }
  }

  ngOnInit() {
    this.remoteHost = this.dataService.remoteHost;
    this.name = localStorage.getItem("userName") || "Unknown";
    this.color = this.color = localStorage.getItem("userColor") || '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  }
}
