import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit {

  @Input() 
  public state: AppState;

  constructor(private element: ElementRef) { }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {
    // console.debug("view checked");
  }

  ngAfterViewInit(): void {
    // console.debug("TEST");
    this.scrollToTurned();
  }

  scrollToTurned() {
    // scroll to turned element
    console.debug(this.state.turnedId);
    let selector = `[data-id="${this.state.turnedId}"]`;
    let el = this.element.nativeElement.querySelector(selector);
    el.scrollIntoView()
  }
}
