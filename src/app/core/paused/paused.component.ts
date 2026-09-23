import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-paused',
    templateUrl: './paused.component.html',
    styleUrls: ['./paused.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PausedComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
