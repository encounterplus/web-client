import { Component, OnInit, ViewChild, Input, HostListener, OnChanges, NgZone } from '@angular/core';
import { CanvasContainerDirective } from './canvas-container.directive';
import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport';
import { MapContainer } from './map-container';
import { AppState } from 'src/app/shared/models/app-state';
import { DataService, RunMode } from 'src/app/shared/services/data.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { TrackedObjectsContainer } from './tracked-objects-container';

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

  // viewport 
  viewport: Viewport;

  // main map container
  mapContainer: MapContainer
  trackedObjectsContainer: TrackedObjectsContainer

  constructor(private dataService: DataService, private zone: NgZone, private toastService: ToastService) {
    
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

      // create map container
      this.mapContainer = new MapContainer(this.dataService);
      this.trackedObjectsContainer = new TrackedObjectsContainer(this.dataService, this.state)

      // add the viewport to the stage
      this.app.stage.addChild(this.viewport)
      this.mapContainer.x = 0
      this.mapContainer.y = 0

      this.app.stage.addChild(this.trackedObjectsContainer)
      this.trackedObjectsContainer.x = 0
      this.trackedObjectsContainer.y = 0

      // activate plugins
      // this.viewport
      //   .drag()
      //   .pinch()
      //   .wheel({
      //     percent: 0.001
      //   })
      //   .clampZoom({
      //     minScale: 0.2, maxScale: 5.0
      //   })

      // configure viewport based on run model
      if (this.dataService.runMode == RunMode.normal) {
        this.viewport
          .drag()
          .pinch()
          .wheel({
            percent: 0.001
          })
          .clampZoom({
            minScale: 0.1, maxScale: 5.0
          })
      }

      // save viewport state on zoom
      this.viewport.on("zoomed-end", (event) => {
        let viewport = this.viewport
        let obj = { x: Math.round(viewport.center.x), y: Math.round(viewport.center.y), zoom: viewport.scale.x }

        if (this.state.map) {
          sessionStorage.setItem(`map-${this.state.map.id}`, JSON.stringify(obj))
          // notify server
          // this.dataService.send({name: WSEventName.mapViewportUpdated, data: {id: this.state.map.id, x: viewport.center.x - viewport.worldWidth/2, y: viewport.center.y - viewport.worldHeight/2, zoom: viewport.zoom}})
        }
      });

      // save viewport zoom state on drag
      this.viewport.on("drag-end", (event) => {
        let viewport = this.viewport
        let obj = { x: Math.round(viewport.center.x), y: Math.round(viewport.center.y), zoom: viewport.scale.x }

        if (this.state.map) {
          sessionStorage.setItem(`map-${this.state.map.id}`, JSON.stringify(obj))
          // notify server
          // this.dataService.send({name: WSEventName.mapViewportUpdated, data: {id: this.state.map.id, x: viewport.center.x - viewport.worldWidth/2, y: viewport.center.y - viewport.worldHeight/2, zoom: viewport.zoom}})
        }
      });

      window['viewport'] = this.viewport

      // add map container
      this.viewport.addChild(this.mapContainer);
      this.mapContainer.app = this.app

      console.debug(`maximum texture size: ${this.canvas.maxTextureSize}`);
      console.debug("map component initialized");

      this.update();
      this.draw();
    }
  }

  update() {
    this.mapContainer.update(this.state)
    this.trackedObjectsContainer.update()
  }

  async draw() {
    await this.mapContainer.draw();

    if (this.mapContainer.w > this.canvas.maxTextureSize || this.mapContainer.h > this.canvas.maxTextureSize) {
      console.error("Unable to render map texture")
      this.toastService.showError(`Unable to render map texture! Map size: ${this.mapContainer.w}x${this.mapContainer.h}px, maximum texture size: ${this.canvas.maxTextureSize}px`, false);
    }

    // update viewport
    this.onResize();

    // let mapData = sessionStorage.getItem(`map-${this.state.map.id}`)
    // if (mapData) {
    //   let mapObj = JSON.parse(mapData)
    //   this.viewport.setZoom(mapObj.zoom)
    //   this.viewport.moveCenter(mapObj.x, mapObj.y)
    // } else {
    //   // fit scale
    //   this.viewport.setZoom(this.state.map.zoom)
    //   this.viewport.moveCenter(this.state.map.x, this.state.map.y)
    // }

    if (this.state.map == null) {
      return
    }

    // set zoom
    if (this.state.screen.tableTopMode) {
      const mapGridSize = this.mapContainer.grid.adjustedSize.width
      const screenGridSize = this.viewport.screenWidth / this.state.screen.width
      let scale = screenGridSize / mapGridSize
      this.viewport.setZoom(scale)
    } else {
      this.viewport.setZoom(this.state.map.zoom)
    }

    // set center
    const x = ((this.state.map.x / this.state.map.zoom) + (this.mapContainer.w/2)) 
    const y = ((this.state.map.y / this.state.map.zoom) + (this.mapContainer.h/2))
    this.viewport.moveCenter(x, y)

    // upadate turned creature
    this.mapContainer.updateTurned(this.state.turned);

    // notify server  
    this.notifyViewportUpdate()

    // // manual render without render loop
    // this.app.render();
  }

  notifyViewportUpdate() {
    if (this.dataService.runMode != RunMode.normal) {
      this.dataService.send({name: WSEventName.mapViewportUpdated, data: {id: this.state.map.id, x: Math.round((this.viewport.center.x - this.viewport.worldWidth/2)), y: Math.round((this.viewport.center.y - this.viewport.worldHeight/2)), zoom: this.viewport.scaled}})
      this.dataService.send({name: WSEventName.trackedObjectsUpdated, data: this.state.trackedObjects})
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    // update viewport
    let sideBarWidth = (document.getElementById("side-bar")?.getBoundingClientRect()?.width ?? 0) + 8.0;
    // this.viewport.resize(window.innerWidth - sideBarWidth, window.innerHeight, this.mapContainer.w, this.mapContainer.h);
    this.viewport.resize(window.innerWidth, window.innerHeight, this.mapContainer.w, this.mapContainer.h);
    this.dataService.send({name: WSEventName.clientUpdated, data: {runMode: this.dataService.runMode, screenWidth: innerWidth, screenHeight: innerHeight}});

    this.trackedObjectsContainer.w = window.innerWidth
    this.trackedObjectsContainer.h = window.innerHeight
    this.trackedObjectsContainer.draw()
  }

  ngOnChanges() {
    console.debug("data changed");

    if (!this.isReady) {
      return;
    }

    this.update()
    this.mapContainer.draw();
    this.trackedObjectsContainer.draw()
  }

  ngAfterViewChecked() {
    // console.log('Change detection triggered!');
  }

  protected _destroy(): void {
    // this.mapLayer.destroy();
  }

  convertScreenToMap(x: number, y: number): PIXI.Point {
    const pointOnScreen = new PIXI.Point(x * this.viewport.screenWidth, y * this.viewport.screenHeight)
    const pointFromCenter = new PIXI.Point(pointOnScreen.x - this.viewport.screenWidth/2, pointOnScreen.y - this.viewport.screenHeight/2)
    // ugh, somethig easier to understand?
    let xx = pointFromCenter.x/this.viewport.scale.x + this.viewport.worldWidth/2 + (this.viewport.center.x-this.viewport.worldWidth/2)
    let yy = pointFromCenter.y/this.viewport.scale.x + this.viewport.worldHeight/2 + (this.viewport.center.y-this.viewport.worldHeight/2)

    return new PIXI.Point(xx, yy)
  }
}
