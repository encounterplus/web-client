import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { Role, Token } from 'src/app/shared/models/token';
import { AppState, RunMode } from 'src/app/shared/models/app-state';

@Component({
  selector: 'ngbd-modal-basic',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss']
})
export class SettingsModalComponent implements OnInit {

  @Input()
  public state: AppState

  remoteHost: string
  name: string;
  color: string;

  maxFPSOptions: Array<number> = [5, 15, 30, 60]
  maxFPS: number = 60
  
  runModeOptions: Array<RunMode> = [RunMode.normal, RunMode.tv]
  runMode: RunMode = RunMode.normal
  tokenId?: string

  get tokens(): Array<Token> {
    if (this.state.map != null) {
      return this.state.map.tokens.filter( token => { return token.role == Role.friendly && token.reference?.includes('/player/') } ).sort((a, b) => (a.name > b.name) ? 1 : -1)
    } else {
      return []
    }
  }

  allowVideo: boolean = true
  maxVideoSize: number = 200
  softEdges: boolean = true

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
  }

  save() {
    localStorage.setItem("userName", this.name)
    localStorage.setItem("userColor", this.color)
    localStorage.setItem("userTokenId", this.tokenId)

    localStorage.setItem("maxFPS", `${this.maxFPS}`)
    localStorage.setItem("allowVideo", `${this.allowVideo}`)
    if (this.maxVideoSize < 0) {
        this.maxVideoSize = 0
    }
    localStorage.setItem("maxVideoSize", `${this.maxVideoSize}`)
    localStorage.setItem("softEdges", `${this.softEdges}`)
    localStorage.setItem("runMode", `${this.runMode}`)

    // update state
    this.state.userTokenId = this.tokenId

    // update server
    this.dataService.send({name: WSEventName.clientUpdated, data: {name: this.name, color: this.color}})

    // close modal
    this.modalInstance.close("save")

    // temporary hack to reload when host changed
    if (this.remoteHost != this.dataService.remoteHost) {
      let search = `?remoteHost=${this.remoteHost}`

      if (this.state.runMode != RunMode.normal) {
        search += `&runMode=${this.state.runMode}`
      }

      if (this.state.deviceType) {
        search += `&deviceType=${this.state.deviceType}`
      }

      // reload
      window.location.search = search
    }

    if (this.runMode != this.state.runMode) {
      this.state.runMode = this.runMode
      window.location.reload()
    }
  }

  ngOnInit() {
    this.remoteHost = this.dataService.remoteHost
    this.name = localStorage.getItem("userName") || "Unknown"
    this.color = this.color = localStorage.getItem("userColor") || '#'+(Math.random()*0xFFFFFF<<0).toString(16)
    this.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60
    this.allowVideo = (localStorage.getItem("allowVideo") || "true") == "true"
    this.maxVideoSize = parseInt(localStorage.getItem("maxVideoSize") || "200")
    this.softEdges = (localStorage.getItem("softEdges") || "true") == "true"
    this.tokenId = localStorage.getItem("userTokenId")
    this.runMode = this.state.runMode
  }
}
