import { Component, OnInit, ViewChild, Input, HostListener, OnChanges } from '@angular/core';
import { CanvasContainerDirective } from './canvas-container.directive';
import { Viewport } from 'pixi-viewport';
import { MapContainer } from './map-container';
import { AppState } from 'src/app/shared/models/app-state';
import { DataService } from 'src/app/shared/services/data.service';

// window.PIXI = PIXI;
// import 'pixi.js';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnChanges {

  @ViewChild(CanvasContainerDirective, { static: true })
  canvas: CanvasContainerDirective;

  @Input()
  public state: AppState = new AppState();

  width = 0;
  height = 0;

  isReady = false;

  // PixiJS
  app: PIXI.Application;
  container: PIXI.Container;

  viewport: Viewport;

  // layers
  mapContainer: MapContainer;

  constructor(private dataService: DataService) {
    this.mapContainer = new MapContainer(this.dataService);
  }

  ngOnInit(): void {
    if (this.canvas !== undefined) {
      this.app = this.canvas.app;
      this.width = this.canvas.width;
      this.height = this.canvas.height;

      // create viewport
      this.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1000,
        worldHeight: 1000,

        // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
        interaction: this.app.renderer.plugins.interaction
      });

      // add the viewport to the stage
      this.app.stage.addChild(this.viewport)

      // activate plugins
      this.viewport
        .drag()
        .pinch()
        .wheel({
          percent: 0.001
        });
      // .snapZoom({
      //   height: 20,
      //   removeOnComplete: true,
      //   removeOnInterrupt: true,
      //   time: 2000,
      // });

      this.viewport.addChild(this.mapContainer);

      // this is not needed now
      // let gl = WebGLRenderingContext;
      // (this.app.renderer.state as any).blendModes[21] = [gl.ONE,  gl.ONE, gl.ZERO, gl.DST_ALPHA, gl.FUNC_ADD, gl.FUNC_ADD]

      console.debug("map component initialized");

      this.update();
      this.draw();
    }
  }

  update() {
    this.mapContainer.update(this.state);
  }

  async draw() {
    await this.mapContainer.draw();

    // update viewport
    this.onResize();

    // fit scale
    this.viewport.fitWorld(true);

    // move center
    this.viewport.moveCenter(this.mapContainer.w / 2, this.mapContainer.h / 2);

    // upadate turned creature
    this.mapContainer.updateTurned(this.state.turned);

    // // manual render without render loop
    // this.app.render();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // update viewport
    let sideBarWidth = (document.getElementById("side-bar")?.getBoundingClientRect()?.width ?? 0) + 8.0;
    this.viewport.resize(window.innerWidth - sideBarWidth, window.innerHeight, this.mapContainer.w, this.mapContainer.h);
  }

  ngOnChanges() {

    console.debug("data changed");

    if (!this.isReady) {
      return;
    }

    this.update();
    this.mapContainer.draw();
  }

  protected _destroy(): void {
    // this.mapLayer.destroy();
  }
}
