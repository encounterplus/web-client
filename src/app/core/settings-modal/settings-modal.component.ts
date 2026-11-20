import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { Utils } from 'src/app/shared/utils';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { AppState, RunMode } from 'src/app/shared/models/app-state';
import { Loader } from '../map/models/loader';
import { SessionService } from 'src/app/shared/services/session.service';
import { resolveEffectIcon } from 'src/app/shared/icons/game-icons';

/** A signed-in player's character as the settings list draws it. */
export interface CharacterRow {
  id: string
  name: string
  detail?: string
  /** The portrait, on the server. */
  image?: string
  /** The game icon font glyph, for a `gi-` icon and no portrait. */
  glyph?: string
  /** What draws without either: the name's first letter. */
  initial: string
}

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

  /** A signed-in player's characters, whose tokens are theirs: a portrait, else the icon, else an initial. */
  get characters(): CharacterRow[] {
    return (this.session.session()?.characters ?? []).map(character => {
      const icon = !character.image && character.icon ? resolveEffectIcon(character.icon) : null
      return {
        id: character.id,
        name: character.name,
        detail: character.detail,
        image: character.image ? this.dataService.baseURL + character.image : icon?.kind == 'image' ? this.dataService.baseURL + icon.src : undefined,
        glyph: icon?.kind == 'glyph' ? icon.char : undefined,
        initial: (character.name.trim()[0] ?? '?').toUpperCase(),
      }
    })
  }

  allowVideo: boolean = true
  maxVideoSize: number = 200
  playVideoAssets: boolean = true
  softEdges: boolean = true

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService, public session: SessionService) { 
  }

  /** How the signed-in role reads to people. */
  get roleTitle(): string {
    switch (this.session.session()?.role) {
      case 'gm': return 'GM'
      case 'player': return 'Player'
      case 'integration': return 'API key'
      default: return 'Guest'
    }
  }

  /** Closes, for the app to open the sign-in dialog. */
  signIn() {
    this.modalInstance.close("signIn")
  }

  async signOut() {
    await this.session.signOut()
    this.modalInstance.close("signedOut")
  }

  save() {
    // a signed-in client is named by its account in the app
    if (!this.session.isSignedIn()) {
      localStorage.setItem("userName", this.name)
      localStorage.setItem("userColor", this.color)
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
    const session = this.session.session()
    this.name = session?.name ?? (localStorage.getItem("userName") || "Unknown")
    this.color = session?.player?.color ?? Utils.userColor()
    this.maxFPS = parseInt(localStorage.getItem("maxFPS") || "60") || 60
    this.allowVideo = (localStorage.getItem("allowVideo") || "true") == "true"
    this.maxVideoSize = parseInt(localStorage.getItem("maxVideoSize") || "200")
    this.playVideoAssets = Loader.playsVideoAssets
    this.softEdges = (localStorage.getItem("softEdges") || "true") == "true"
    this.runMode = this.state.runMode
  }
}
