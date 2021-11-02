import { Component, OnInit, Input } from '@angular/core';
import { Screen } from 'src/app/shared/models/screen';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements OnInit {

  @Input() 
  public screen: Screen;

  get text(): string {
      return (this.screen.overlayHandoutText || this.screen.overlayHandountText)
  }

  get style(): string {
      return this.screen.overlayHandoutStyle
  }

  constructor(public dataService: DataService) { }

  ngOnInit(): void {
  }

}
