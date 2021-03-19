import { Component, OnInit, ViewChild, Input, HostListener, OnChanges, NgZone } from '@angular/core';
import { CanvasContainerDirective } from './canvas-container.directive';
import { Viewport } from 'pixi-viewport';
import { MapContainer } from './map-container';
import { AppState } from 'src/app/shared/models/app-state';
import { DataService } from 'src/app/shared/services/data.service';
import { ToastService } from 'src/app/shared/services/toast.service';

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

  constructor(private dataService: DataService, private zone: NgZone, private toastService: ToastService) {
    this.mapContainer = new MapContainer(this.dataService);
  }

  ngOnInit(): void {
    if (this.canvas !== undefined) {
      this.app = this.canvas.app;
      this.width = this.canvas.width;
      this.height = this.canvas.height;

      // sigh, we need to run this outside angular
      // to prevent triggering changes
      this.zone.runOutsideAngular(() => {
        // create viewport
        this.viewport = new Viewport({
          screenWidth: window.innerWidth,
          screenHeight: window.innerHeight,
          worldWidth: 1000,
          worldHeight: 1000,

          // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
          interaction: this.app.renderer.plugins.interaction
        });
      });

      // add the viewport to the stage
      this.app.stage.addChild(this.viewport)
      this.mapContainer.x = 0
      this.mapContainer.y = 0

      // activate plugins
      this.viewport
        .drag()
        .pinch()
        .wheel({
          percent: 0.001
        })
        .clampZoom({
          minScale: 0.2, maxScale: 5.0
        })

      // save viewport state on zoom
      this.viewport.on("zoomed-end", (viewport) => {
          let obj = {x: Math.round(viewport.center.x), y: Math.round(viewport.center.y), zoom: viewport.scale.x}
          sessionStorage.setItem(`map-${this.state.map.id}`, JSON.stringify(obj))
      });

      // save viewport zoom state on drag
      this.viewport.on("drag-end", (event) => {
        let viewport = event.viewport
        let obj = {x: Math.round(viewport.center.x), y: Math.round(viewport.center.y), zoom: viewport.scale.x}
        sessionStorage.setItem(`map-${this.state.map.id}`, JSON.stringify(obj))
      });

      // add map container
      this.viewport.addChild(this.mapContainer);
      this.mapContainer.app = this.app

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

    if (this.mapContainer.w > this.canvas.maxTextureSize || this.mapContainer.h > this.canvas.maxTextureSize) {
      console.error("Unable to render map texture")
      this.toastService.showError(`Unable to render map texture! Map size: ${this.mapContainer.w}x${this.mapContainer.h}px, maximum texture size: ${this.canvas.maxTextureSize}px`, false);
    }

    // update viewport
    this.onResize();

    let mapData = sessionStorage.getItem(`map-${this.state.map.id}`)
    if (mapData) {
      let mapObj = JSON.parse(mapData)
      this.viewport.setZoom(mapObj.zoom)
      this.viewport.moveCenter(mapObj.x, mapObj.y);
    } else {
      // fit scale
      this.viewport.fitWorld(true);
      this.viewport.moveCenter(this.mapContainer.w / 2, this.mapContainer.h / 2);
    }

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

  // ngAfterViewChecked() {
  //   console.log('Change detection triggered!');
  // }

  protected _destroy(): void {
    // this.mapLayer.destroy();
  }
}
