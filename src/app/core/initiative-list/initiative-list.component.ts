import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-initiative-list',
  templateUrl: './initiative-list.component.html',
  styleUrls: ['./initiative-list.component.scss']
})
export class InitiativeListComponent implements OnInit {

  @Input() 
  public data: {};

  constructor() { }

  ngOnInit(): void {
  }

}
