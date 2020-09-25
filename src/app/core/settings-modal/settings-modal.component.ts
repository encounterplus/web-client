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

  maxFPSOptions: Array<number> = [5, 15, 30, 60];
  maxFPS: number = 60;

  allowVideo: boolean = true;
  maxVideoSize: number = 200;

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
  }

  save() {
    localStorage.setItem("userName", this.name);
    localStorage.setItem("userColor", this.color);
    localStorage.setItem("maxFPS", `${this.maxFPS}`);
    localStorage.setItem("allowVideo", `${this.allowVideo}`);
    if (this.maxVideoSize < 0) {
        this.maxVideoSize = 0
    }
    localStorage.setItem("maxVideoSize", `${this.maxVideoSize}`);

    // update server
    this.dataService.send({name: WSEventName.clientUpdated, data: {name: this.name, color: this.color}});

    // close modal
    this.modalInstance.close("save");

    // temporary hack to reload when host changed
    if (this.remoteHost != this.dataService.remoteHost) {
      document.location.search = `?remoteHost=${this.remoteHost}`;
    }
  }

  ngOnInit() {
    this.remoteHost = this.dataService.remoteHost;
    this.name = localStorage.getItem("userName") || "Unknown";
    this.color = this.color = localStorage.getItem("userColor") || '#'+(Math.random()*0xFFFFFF<<0).toString(16);
    this.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60;
    this.allowVideo = (localStorage.getItem("allowVideo") || "true") == "true";
    this.maxVideoSize = parseInt(localStorage.getItem("maxVideoSize") || "200");
  }
}
