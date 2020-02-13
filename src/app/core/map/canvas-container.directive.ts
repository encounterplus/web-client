import { Directive, AfterViewInit, ElementRef, HostListener } from '@angular/core';
import * as PIXI from 'pixi.js';

@Directive({
  selector: '[appCanvasContainer]'
})
export class CanvasContainerDirective implements AfterViewInit {
  
  // static PIXI options
  static OPTIONS: Object = {
    backgroundColor: 0x1099bb, 
    resolution: window.devicePixelRatio || 1,
    antialias: true,
    forceFXAA: true,
    autoResize: true
  };

  element: HTMLDivElement;

  // PIXI app and stage references
  app: PIXI.Application;
  width: number;
  height: number;

  constructor(private el: ElementRef) { 
    this.element = <HTMLDivElement> el.nativeElement;

    const options = Object.assign({width: this.element.clientWidth, height: this.element.clientHeight},
                    CanvasContainerDirective.OPTIONS);

    this.app = new PIXI.Application(options);

    this.element.appendChild(this.app.view);

    this.width  = this.app.view.width;
    this.height = this.app.view.height;

    console.debug(`canvas container initialized`);
  }

  ngAfterViewInit(): void {
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = event.target.innerWidth;
    this.height = event.target.innerHeight;

    this.app.renderer.resize(this.width, this.height);
  }
}
