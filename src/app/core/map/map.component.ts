import { Component, OnInit, ViewChild, Input, SimpleChanges } from '@angular/core';
import { CanvasContainerDirective } from './canvas-container.directive';
// import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { Game } from 'src/app/shared/models/game';
import { Map } from 'src/app/shared/models/map';
import { ScreenConfig } from 'src/app/shared/models/screen-config';
import { MapContainer } from './map-container';
import { AppState } from 'src/app/shared/models/app-state';
import { Creature } from 'src/app/shared/models/creature';

window.PIXI = PIXI;

import 'pixi.js';
import 'pixi-layers';
import { DataService } from 'src/app/shared/services/data.service';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @ViewChild(CanvasContainerDirective, {static: true})
  canvas: CanvasContainerDirective;

  @Input() 
  public state: AppState = new AppState();

  width: number = 0;
  height: number = 0;

  isReady: boolean = false;

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
      this.app  = this.canvas.app;
      this.width  = this.canvas.width;
      this.height = this.canvas.height;

      // create viewport
      this.viewport = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 100,
        worldHeight: 100,

        interaction: this.app.renderer.plugins.interaction // the interaction module is important for wheel to work properly when renderer.view is placed or scaled
      })

      // this.app.stage = new PIXI.display.Stage();

      // add the viewport to the stage
      this.app.stage.addChild(this.viewport)

      // activate plugins
      this.viewport
        .drag()
        .pinch()
        .wheel({
          percent: 0.001
        })
        .snapZoom({
          height: 20,
          removeOnComplete: true,
          removeOnInterrupt: true,
          time: 2000,
        });

      this.viewport.addChild(this.mapContainer);

      // this.app.stage.addChild(this.mapContainer)

      // void gl.blendEquationSeparate(modeRGB, modeAlpha);
      // void gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
      let gl = WebGLRenderingContext;
      (this.app.renderer.state as any).blendModes[21] = [gl.ONE,  gl.ONE, gl.ZERO, gl.DST_ALPHA, gl.FUNC_ADD, gl.FUNC_ADD]
       
      console.debug("map component initialized");

      this.update()
      this.draw();
    }
  }

  update() {
    this.mapContainer.update(this.state);
  }

  async draw() {
    await this.mapContainer.draw();

    this.viewport.worldWidth = this.mapContainer.backgroundLayer.w;
    this.viewport.worldHeight = this.mapContainer.backgroundLayer.h;

    // this.mapContainer.tokensLayer.updateTurned(this.state.turned);

    
    // this.viewport.position.x = (this.mapContainer.backgroundLayer.w / 2) + this.state.map.x;
    // this.viewport.position.y = (this.mapContainer.backgroundLayer.h / 2) + this.state.map.y;
    
    
    // this.viewport.position.x = - (((this.mapContainer.backgroundLayer.w / 2) - this.state.map.x) * this.state.map.zoom);
    // this.viewport.position.y = - (((this.mapContainer.backgroundLayer.h / 2) - this.state.map.y) * this.state.map.zoom);

    // console.warn(this.viewport.screenWidth);
    // console.warn(this.viewport.screenHeight);
    // this.viewport.position.x =  -((this.mapContainer.backgroundLayer.w / 2));
    // this.viewport.position.y =  -((this.mapContainer.backgroundLayer.h / 2));
    // this.viewport.setZoom(this.state.map.zoom);

    this.viewport.fitWorld(false);


    // this.viewport.setTransform(-this.state.map.x, -this.state.map.y);

    // this.viewport.worldWidth = c;
    // this.viewport.worldHeight = this.mapContainer.h;

    // this.viewport.resize(window.innerWidth, window.innerHeight, this.mapContainer.w, this.mapContainer.h);

    // console.debug(this.viewport.worldWidth);
    // console.debug(this.viewport.worldHeight);

    this.viewport.forceHitArea = new PIXI.Rectangle(0,0, this.mapContainer.w, this.mapContainer.h);

    // // manual render without render loop
    // this.app.render();
  }

  ngOnChanges(changes: SimpleChanges) {


    console.debug("data changed");

    if (!this.isReady) {
      return;
    }

    this.update();
    this.mapContainer.draw();

  }

  // protected _draw(): void {
  //   console.debug("drawing map component");
  //   this.app.stage.removeChildren();
  //   this.app.stage.addChild(this.mapLayer);
  // }

  protected _destroy(): void {
    // this.mapLayer.destroy();
  }
}
