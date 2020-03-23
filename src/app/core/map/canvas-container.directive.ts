import { Directive, AfterViewInit, ElementRef, HostListener, NgZone, Input } from '@angular/core';
import * as PIXI from 'pixi.js';
import { delayWhen } from 'rxjs/operators';

@Directive({
  selector: '[appCanvasContainer]'
})
export class CanvasContainerDirective implements AfterViewInit {
  
  element: HTMLDivElement;

  // PIXI app and stage references
  app: PIXI.Application;
  width: number;
  height: number;

  @Input()
  // public devicePixelRatio = window.devicePixelRatio || 1;
  public devicePixelRatio = 1;

  @Input()
  public applicationOptions: Object = {
    backgroundColor: 0x333333, 
    // resolution:  window.devicePixelRatio || 1,
    resolution:  1,
    antialias: true,
    transparent: false,
    // forceFXAA: true,
    autoResize: true,
    // sharedTicker: true,
    // autoStart: false
  };

  constructor(private el: ElementRef, private zone: NgZone) { 
    this.element = <HTMLDivElement> el.nativeElement;

    const options = Object.assign({width: this.element.clientWidth, height: this.element.clientHeight},
                    this.applicationOptions);

    this.zone.runOutsideAngular(() => {
      this.app = new PIXI.Application(options);
    });

    this.element.appendChild(this.app.view);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    const viewportScale = 1 / this.devicePixelRatio;
    this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio);
    // this.app.view.style.transform = `scale(${viewportScale})`;
    // this.app.view.style.transformOrigin = `top left`;

    // this.app.ticker.minFPS = 30;

    // Confirm that WebGL is available
    if ( this.app.renderer.type !== PIXI.RENDERER_TYPE.WEBGL ) {
      throw new Error("No WebGL Support!");
    }

    let ticker = PIXI.Ticker.shared;
    ticker.autoStart = false;
    ticker.stop();

    console.debug(`canvas container initialized`);
  }

  ngAfterViewInit(): void {
    // debuging tools
    window.PIXI = PIXI;
  }

  // @HostListener('window:resize', ['$event'])
  // onResize(event) {
  //   this.width = event.target.innerWidth;
  //   this.height = event.target.innerHeight;

  //   this.app.renderer.resize(this.width, this.height);
  // }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const viewportScale = 1 / this.devicePixelRatio;
    this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio);
    // this.app.view.style.transform = `scale(${viewportScale})`;
    // this.app.view.style.transformOrigin = `top left`;

    this.app.stage
  }

  destroy() {
    this.app.destroy();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
