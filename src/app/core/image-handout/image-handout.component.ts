import { Component, OnInit, Input } from '@angular/core';
import { Screen } from 'src/app/shared/models/screen';
import { DataService } from 'src/app/shared/services/data.service';
import { Lightbox } from 'ngx-lightbox';

@Component({
  selector: 'app-image-handout',
  templateUrl: './image-handout.component.html',
  styleUrls: ['./image-handout.component.scss']
})
export class ImageHandoutComponent implements OnInit {

  @Input() 
  public screen: Screen;

  get image(): string {
    return `http://${this.dataService.remoteHost}${this.screen.overlayImage}`;
  }

  constructor(public dataService: DataService, private lightbox: Lightbox) { }

  open(): void {
    // open lightbox
    this.lightbox.open([{src: this.image, caption: null, thumb: null}]);
  }

  close(): void {
    // close lightbox programmatically
    this.lightbox.close();
  }

  ngOnInit(): void {
  }

}
