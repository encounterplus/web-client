import { Component, OnInit, Input } from '@angular/core';
import { Screen } from 'src/app/shared/models/screen';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
    selector: 'app-image-handout',
    templateUrl: './image-handout.component.html',
    styleUrls: ['./image-handout.component.scss'],
    standalone: false
})
export class ImageHandoutComponent implements OnInit {

  @Input() 
  public overlayImage?: string;

  public lightboxOpen = false;

  get image(): string {
    if (this.overlayImage && this.overlayImage.startsWith("http")) {
      return this.overlayImage;
    } else {
      return `${this.dataService.protocol}//${this.dataService.remoteHost}${this.overlayImage}`;
    }
  }

  constructor(public dataService: DataService) { }

  open(): void {
    this.lightboxOpen = true;
  }

  close(): void {
    this.lightboxOpen = false;
  }

  ngOnInit(): void {
  }

}
