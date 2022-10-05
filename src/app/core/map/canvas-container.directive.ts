import { Directive, AfterViewInit, ElementRef, HostListener, NgZone, Input, OnDestroy } from '@angular/core';
import * as PIXI from 'pixi.js'
import { DataService } from 'src/app/shared/services/data.service';
import { ToastService } from 'src/app/shared/services/toast.service';
// for debugger
window["PIXI"] = PIXI;

@Directive({
  selector: '[appCanvasContainer]'
})
export class CanvasContainerDirective implements AfterViewInit, OnDestroy {

  element: HTMLDivElement;

  // PIXI app and stage references
  app: PIXI.Application;
  width: number;
  height: number;

  maxTextureSize: number;

  // public devicePixelRatio = window.devicePixelRatio || 1;
  public devicePixelRatio = 1;

  public applicationOptions = {
    backgroundColor: 0x00000,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    // resolution: 1.0,
    // antialias: true,
    // transparent: false,
    // forceFXAA: true,
    // autoResize: true,
    // sharedTicker: true,
    // autoStart: false
  };

  constructor(private el: ElementRef, private zone: NgZone, private toastService: ToastService) {
    this.element = el.nativeElement as HTMLDivElement;

     // gameboard resolution hack to fix devicePixelRatio not reported properly by browser
    const urlParams = new URLSearchParams(window.location.search);
    const deviceType = urlParams.get('device') 

    if (deviceType == "gameboard") {
      this.applicationOptions.resolution =  1.5

        // webgl2 force
        PIXI.settings.PREFER_ENV = PIXI.ENV.WEBGL2
    }

    const options = Object.assign({ width: this.element.clientWidth, height: this.element.clientHeight },
      this.applicationOptions);

    this.zone.runOutsideAngular(() => {
      // prevents pixi ticker to clash with zone

      try {
        this.app = new PIXI.Application(options);
      } catch(err) {
          // show error
          this.toastService.showError(err.message, false);
          throw err
      }

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
    this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio);
    // this.app.renderer.resize(this.width, this.height);

    // this.app.ticker.minFPS = 30;
    this.app.ticker.maxFPS = parseInt(localStorage.getItem('maxFPS') || '60', 10) || 60;

    // Confirm that WebGL is available
    if (this.app.renderer.type !== PIXI.RENDERER_TYPE.WEBGL) {
      this.toastService.showError('No WebGL Support!', false);
      throw new Error('No WebGL Support!')
    }

    const gl = (this.app.renderer as PIXI.Renderer).gl;
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    // console.debug(`maximum texture size: ${this.maxTextureSize}`);

    // let ticker = PIXI.Ticker.shared;
    // ticker.autoStart = false;
    // ticker.stop();

    // console.debug(`canvas container initialized`);
  }

  ngAfterViewInit(): void {
    // debuging tools
    // window.PIXI = PIXI;

    console.debug('pixel ratio: ' + window.devicePixelRatio)
    console.debug('width: ' + this.width)
    console.debug('height: ' + this.height)
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio)
    // this.app.renderer.resize(600, 600)

    console.debug('---window resize---')
    console.debug('pixel ratio: ' + window.devicePixelRatio)
    console.debug('width: ' + this.width)
    console.debug('height: ' + this.height)
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
