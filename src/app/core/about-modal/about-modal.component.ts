import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DataService } from 'src/app/shared/services/data.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'ngbd-modal-basic',
  templateUrl: './about-modal.component.html',
  styleUrls: ['./about-modal.component.scss']
})
export class AboutModalComponent implements OnInit {

  version: string;

  constructor(public modalInstance: NgbActiveModal, private dataService: DataService) { 
    this.version = environment.version;
  }

  ngOnInit(): void {
  }
}
