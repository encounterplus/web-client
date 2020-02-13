import { Component, OnInit, ViewChild } from '@angular/core';
import { CanvasContainerDirective } from './canvas-container.directive';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

  @ViewChild(CanvasContainerDirective, {static: true})
  canvas: CanvasContainerDirective;

  width: number = 0;
  height: number = 0;

  // PixiJS
  app: PIXI.Application;
  container: PIXI.Container;

  viewport: Viewport;

  constructor() { 
  }

  ngOnInit(): void {
    if (this.canvas !== undefined) {
      this.app  = this.canvas.app;
      this.width  = this.canvas.width;
      this.height = this.canvas.height;

      this.__setup();
    }
  }

  protected __setup(): void {
    // Create a new texture
    let tokenTexture = PIXI.Texture.from('/assets/img/token.png');
    let mapTexture = PIXI.Texture.from('/assets/img/map.jpg');

    this.viewport = new Viewport({
      screenWidth: this.width,
      screenHeight: this.height,
      worldWidth: this.width,
      worldHeight: this.height,
      interaction: this.app.renderer.plugins.interaction
    });

    // add the viewport to the stage
    this.app.stage.addChild(this.viewport);

    // activate plugins
    this.viewport
        .drag()
        .wheel()

    this.container = new PIXI.Container();
    this.viewport.addChild(this.container);

    let map = new PIXI.Sprite(mapTexture);
    map.x = 0;
    map.y = 0;

    this.container.addChild(map);

    const canvas = document.createElement('canvas');
    canvas.width  = 50;
    canvas.height = 50;

    let context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(50, 0);
    context.lineTo(0, 0);
    context.lineTo(0, 50);
    context.lineWidth = 1;
    context.strokeStyle = '#ffffff';
    context.stroke();

    const tileTexture = PIXI.Texture.from(canvas);
    const background = new PIXI.TilingSprite(tileTexture, map.width, map.height);

    this.container.addChild(background)
    

    // Create a 5x5 grid of bunnies
    for (let i = 1; i < 25; i++) {
        const token = new PIXI.Sprite(tokenTexture);
        token.anchor.set(0.5);
        token.x = (i % 5) * 100;
        token.y = Math.floor(i / 5) * 100;
        // token.interactive = true;
        token.width = 50;
        token.height = 50;


        // token
        //     .on('pointerdown', onDragStart)
        //     .on('pointerup', onDragEnd)
        //     .on('pointerupoutside', onDragEnd)
        //     .on('pointermove', onDragMove);
        this.container.addChild(token);
    }

  }

}
