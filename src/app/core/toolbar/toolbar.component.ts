import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';

export enum Tool {
  move = "move",
  pointer = "pointer",
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

  constructor(private element: ElementRef, private modalService: NgbModal) { }

  activeTool: Tool = Tool.move;

  activeToolChanged(newTool) {
    this.tool.emit(newTool);
  }

  showSettings() {
    this.action.emit("showSettings");
  }

  showAbout() {
    this.action.emit("showAbout");
  }

  ngOnInit(): void {
  }

}
