import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';

@Component({
  selector: 'app-zoombar',
  templateUrl: './zoombar.component.html',
  styleUrls: ['./zoombar.component.scss']
})
export class ZoombarComponent implements OnInit {

  @Input() 
  public state: AppState;

  @Output()
  public action = new EventEmitter<string>();

  constructor() { }

  get tokenFocusVisible(): boolean {
    return this.state.userTokenId != null && this.state.userTokenId != "null"
  }

  ngOnInit(): void {
  }

  zoomIn() {
    this.action.emit("zoomIn");
  }

  zoomOut() {
    this.action.emit("zoomOut");
  }

  focusToken() {
    this.action.emit("focusToken");
  }

}
