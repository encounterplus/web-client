import { Directive, AfterViewInit, ElementRef, HostListener, Input, OnDestroy } from '@angular/core';
import * as PIXI from 'pixi.js'
import { DataService } from 'src/app/shared/services/data.service';
import { ToastService } from 'src/app/shared/services/toast.service';
// for debugger
window["PIXI"] = PIXI;

@Directive({
    selector: '[appCanvasContainer]',
    standalone: false
})
export class CanvasContainerDirective implements AfterViewInit, OnDestroy {

  element: HTMLDivElement;

  // PIXI app and stage references
  app!: PIXI.Application;
  width: number = 0;
  height: number = 0;

  readyPromise!: Promise<void>;

  maxTextureSize: number = 0;

  isReady = false;

  // public devicePixelRatio = window.devicePixelRatio || 1;
  public devicePixelRatio = 1;

  public applicationOptions = {
    background: 0x00000,
    autoDensity: true,
    resolution: window.devicePixelRatio || 1,
    // resolution: 1.0,
    antialias: true,
    preference: 'webgl' as 'webgl',
  };

  constructor(private el: ElementRef, private toastService: ToastService) {
    this.element = el.nativeElement as HTMLDivElement;

    // gameboard resolution hack to fix devicePixelRatio not reported properly by browser
    const urlParams = new URLSearchParams(window.location.search);
    const deviceType = urlParams.get('device');

    if (deviceType == 'gameboard') {
      this.applicationOptions.resolution = 1.5;
    }

    // prevents mouse zoom on document
    this.element.addEventListener('wheel', e => {
      if (!(e.currentTarget as HTMLElement)?.closest('app-initiative-list')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  protected async initApp(): Promise<void> {
    const options = Object.assign({ width: this.element.clientWidth, height: this.element.clientHeight },
      this.applicationOptions);

    this.app = new PIXI.Application();

    try {
      await this.app.init(options);
      this.isReady = true;
    } catch (err) {
      this.toastService.showError(err instanceof Error ? err.message : String(err), false);
      throw err;
    }

    this.element.appendChild(this.app.canvas);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.app.renderer.resize(this.width * this.devicePixelRatio, this.height * this.devicePixelRatio);

    // this.app.ticker.minFPS = 30;
    this.app.ticker.maxFPS = parseInt(localStorage.getItem('maxFPS') || '60', 10) || 60;

    this.maxTextureSize = this.readMaxTextureSize();

    // Confirm that WebGL is available
    // if (this.app.renderer.type !== 'webgl') {
    //   this.toastService.showError('No WebGL Support!', false);
    //   throw new Error('No WebGL Support!');
    // }
  }

  // pixi 8 does not surface a texture size limit, so read it off the underlying
  // context. the map size guard in MapComponent depends on this being a number:
  // while it was undefined every comparison against it was false and the guard
  // silently never fired.
  private readMaxTextureSize(): number {
    const renderer = this.app.renderer as any;

    // webgl (the configured preference)
    const gl = renderer.gl as WebGLRenderingContext | undefined;
    if (gl) {
      return gl.getParameter(gl.MAX_TEXTURE_SIZE);
    }

    // webgpu, in case the preference is ever changed or falls back
    const limit = renderer.gpu?.device?.limits?.maxTextureDimension2D;
    if (limit) {
      return limit;
    }

    // last resort: the minimum every WebGL2 implementation must support, so the
    // guard errs towards warning rather than staying silent
    console.warn('unable to read maximum texture size from renderer, assuming 2048');
    return 2048;
  }

  async ngAfterViewInit(): Promise<void> {
    this.readyPromise = this.initApp();
    await this.readyPromise;

    console.debug('pixel ratio: ' + window.devicePixelRatio)
    console.debug('width: ' + this.width)
    console.debug('height: ' + this.height)
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: UIEvent) {

    if (!this.isReady) {
      return;
    }

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
