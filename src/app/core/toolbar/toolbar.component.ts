import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { DataService } from 'src/app/shared/services/data.service';

export enum Tool {
  move = "move",
  pointer = "pointer",
}

export enum Panel {
  none = "none",
  messages = "messages",
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss']
})
export class ToolbarComponent implements OnInit {

  @Input() 
  public state: AppState;

  @Output()
  public action = new EventEmitter<string>();

  @Output()
  public tool = new EventEmitter<Tool>();

  @Output()
  public panel = new EventEmitter<Panel>();

  constructor(private element: ElementRef, private modalService: NgbModal, private dataService: DataService) { }

  activeTool: Tool = Tool.move;

  messages: Boolean = false;
  videoControlsVisible: Boolean = false;
  videoPaused: boolean = false;
  videoMuted: boolean = true;

  activeToolChanged(newTool) {
    this.tool.emit(newTool);
  }

  messagesChanged(newValue) {
    let activePanel =  newValue ? Panel.messages : Panel.none;
    localStorage.setItem("activePanel", activePanel);

    this.panel.emit(activePanel);
  }

  showSettings() {
    this.action.emit("showSettings");
  }

  showAbout() {
    this.action.emit("showAbout");
  }

  videoPauseToggle() {
    this.videoPaused = !this.videoPaused;
    this.dataService.updateVideoPaused(this.videoPaused);
  }

  videoMuteToggle() {
    this.videoMuted = !this.videoMuted;
    this.dataService.updateVideoMuted(this.videoMuted);
  }

  ngOnInit() {
    this.messages = (localStorage.getItem("activePanel") || Panel.none) == Panel.messages;

    this.dataService.videoMuted.subscribe(value => this.videoMuted);
    this.dataService.videoPaused.subscribe(value => this.videoPaused);
  }
}
