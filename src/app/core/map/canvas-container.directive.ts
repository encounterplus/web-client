import { Directive, AfterViewInit, ElementRef, HostListener, NgZone, Input, OnDestroy } from '@angular/core';
import * as PIXI from 'pixi.js';
window.PIXI = PIXI;

@Directive({
  selector: '[appCanvasContainer]'
})
export class CanvasContainerDirective implements AfterViewInit, OnDestroy {

  element: HTMLDivElement;

  // PIXI app and stage references
  app: PIXI.Application;
  width: number;
  height: number;

  @Input()
  // public devicePixelRatio = window.devicePixelRatio || 1;
  public devicePixelRatio = 1;

  @Input()
  public applicationOptions = {
    backgroundColor: 0x00000,
    resolution: window.devicePixelRatio || 1,
    // resolution:  1,
    antialias: true,
    transparent: false,
    // forceFXAA: true,
    autoResize: true,
    // sharedTicker: true,
    // autoStart: false
  };

  constructor(private el: ElementRef, private zone: NgZone) {
    this.element = el.nativeElement as HTMLDivElement;

    const options = Object.assign({ width: this.element.clientWidth, height: this.element.clientHeight },
      this.applicationOptions);

    this.zone.runOutsideAngular(() => {
      // prevents pixi ticker to clash with zone
      this.app = new PIXI.Application(options);

      // prevents mouse zoom on document
      this.element.addEventListener('wheel', e => {
        if (!(e.currentTarget as HTMLElement)?.closest('app-initiative-list')) {
          e.preventDefault();
        }
      }, { passive: false });

    });

    this.element.appendChild(this.app.view);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // const viewportScale = 1 / this.devicePixelRatio;
    // this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio);
    this.app.renderer.resize(this.width, this.height);

    // this.app.ticker.minFPS = 30;
    this.app.ticker.maxFPS = parseInt(localStorage.getItem('maxFPS') || '60', 10) || 60;

    // Confirm that WebGL is available
    if (this.app.renderer.type !== PIXI.RENDERER_TYPE.WEBGL) {
      throw new Error('No WebGL Support!');
    }

    const gl = this.app.renderer.gl;
    const max = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    console.debug(`maximum texture size: ${max}`);

    // let ticker = PIXI.Ticker.shared;
    // ticker.autoStart = false;
    // ticker.stop();

    console.debug(`canvas container initialized`);
  }

  ngAfterViewInit(): void {
    // debuging tools
    window.PIXI = PIXI;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio);
  }

  // @HostListener('document:touchstart', ['$event'])
  // onTouchStart(event) {
  //   // do something meaningful with it
  //   event.preventDefault();
  //   console.log(`The touch started ${event}!`);
  // }

  destroy() {
    this.app.destroy();
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}
