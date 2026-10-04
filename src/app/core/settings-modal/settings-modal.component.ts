import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { Utils } from 'src/app/shared/utils';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { Role, Token } from 'src/app/shared/models/token';
import { AppState, RunMode } from 'src/app/shared/models/app-state';
import { Appearance, saveAppearance, storedAppearance } from 'src/app/shared/appearance';
import { Loader } from '../map/models/loader';

@Component({
    selector: 'ngbd-modal-basic',
    templateUrl: './settings-modal.component.html',
    styleUrls: ['./settings-modal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SettingsModalComponent implements OnInit {

  @Input()
  public state!: AppState

  remoteHost: string = ""
  name: string = "";
  color: string = "";

  maxFPSOptions: Array<number> = [5, 15, 30, 60]
  maxFPS: number = 60
  
  runModeOptions: Array<RunMode> = [RunMode.normal, RunMode.tv]
  runMode: RunMode = RunMode.normal
  appearanceOptions = [
    { value: Appearance.automatic, label: "Automatic" },
    { value: Appearance.light, label: "Light" },
    { value: Appearance.dark, label: "Dark" },
  ]
  appearance: Appearance = Appearance.automatic
  tokenId?: string | null

  get tokens(): Array<Token> {
    if (this.state.map != null) {
      return this.state.map.tokens.filter( token => { return token.role == Role.friendly } ).sort((a, b) => ((a.name ?? "") > (b.name ?? "")) ? 1 : -1)
    } else {
      return []
    }
  }

  allowVideo: boolean = true
  maxVideoSize: number = 200
  playVideoAssets: boolean = true
  softEdges: boolean = true

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
  }

  save() {
    localStorage.setItem("userName", this.name)
    localStorage.setItem("userColor", this.color)
    if (this.tokenId) {
      localStorage.setItem("userTokenId", this.tokenId)
      this.state.userTokenId = this.tokenId
    } else {
      localStorage.removeItem("userTokenId")
      this.state.userTokenId = undefined
    }

    localStorage.setItem("maxFPS", `${this.maxFPS}`)
    localStorage.setItem("allowVideo", `${this.allowVideo}`)
    if (this.maxVideoSize < 0) {
        this.maxVideoSize = 0
    }
    localStorage.setItem("maxVideoSize", `${this.maxVideoSize}`)
    localStorage.setItem("playVideoAssets", `${this.playVideoAssets}`)
    localStorage.setItem("softEdges", `${this.softEdges}`)
    localStorage.setItem("runMode", `${this.runMode}`)
    saveAppearance(this.appearance)

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

      if (this.state.device) {
        search += `&device=${this.state.device}`
      }

      // reload
      window.location.search = search
    }

    if (this.runMode != this.state.runMode) {
      window.location.reload()
    }
  }

  ngOnInit() {
    this.remoteHost = this.dataService.remoteHost
    this.name = localStorage.getItem("userName") || "Unknown"
    this.color = Utils.userColor()
    this.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60
    this.allowVideo = (localStorage.getItem("allowVideo") || "true") == "true"
    this.maxVideoSize = parseInt(localStorage.getItem("maxVideoSize") || "200")
    this.playVideoAssets = Loader.playsVideoAssets
    this.softEdges = (localStorage.getItem("softEdges") || "true") == "true"
    const storedToken = localStorage.getItem("userTokenId")
    this.tokenId = storedToken && storedToken !== "null" && storedToken !== "undefined" ? storedToken : null
    this.runMode = this.state.runMode
    this.appearance = storedAppearance()
  }
}
