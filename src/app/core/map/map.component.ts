import { Component, OnInit, ViewChild, Input, HostListener, OnChanges, NgZone } from '@angular/core';
import { CanvasContainerDirective } from './canvas-container.directive';
import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport';
import { MapContainer } from './map-container';
import { AppState, RunMode } from 'src/app/shared/models/app-state';
import { DataService } from 'src/app/shared/services/data.service';
import { ToastService } from 'src/app/shared/services/toast.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { TrackedObjectsContainer } from './tracked-objects-container';
import { ControlState } from './views/token-view';

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

  // Keyboard tracked hotkeys
  kb = {
      kbDrag: false,
      arrowUp: false,
      arrowDown: false,
      arrowLeft: false,
      arrowRight: false,
      keyShiftL: false,
      keyShiftR: false,
      keyEqual: false,
      keyMinus: false,
      keyT: false,
      keyEsc: false
  }
  gpButtons?: GamepadButton[];
  gpTS?: number;


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

      // configure viewport based on run model
      if (this.state.runMode == RunMode.normal) {
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
      let ticker = new PIXI.Ticker;
      ticker.maxFPS = 20;
      ticker.autoStart = true;
      // Gamepad & KB Support
      ticker.add(()=>{
        let token = this.mapContainer.tokenViewById(localStorage.getItem("userTokenId"))
        let x = token?.position.x
        let y = token?.position.y
        let pos = this.viewport.center

        // Keyboard Controls
          // Zoom In/Out
        if (this.kb.keyMinus)
              this.viewport.animate({ scale: this.viewport.scale.x - 0.1, time: 100 })
        else if (this.kb.keyEqual)
              this.viewport.animate({ scale: this.viewport.scale.x + 0.1, time: 100 })
        if (token) {
            //Move token
            if (this.kb.arrowUp && !this.kb.keyShiftL && !this.kb.keyShiftR) {
                y -= Math.ceil(token.grid.size*.1);
            } else if (this.kb.arrowDown && !this.kb.keyShiftL && !this.kb.keyShiftR) {
                y += Math.ceil(token.grid.size*.1);
            }
            if (this.kb.arrowLeft && !this.kb.keyShiftL && !this.kb.keyShiftR) {
                x -= Math.ceil(token.grid.size*.1);
            } else if (this.kb.arrowRight && !this.kb.keyShiftL && !this.kb.keyShiftR) {
                x += Math.ceil(token.grid.size*.1);
            }
            // Token rotation
            let tokenRotation = token.token.rotation
            if (this.kb.arrowLeft && (this.kb.keyShiftL||this.kb.keyShiftR)) {
                tokenRotation -= 5
                if (tokenRotation<0) tokenRotation += 360
            } else if (this.kb.arrowRight && (this.kb.keyShiftL||this.kb.keyShiftR)) {
                tokenRotation += 5
                if (tokenRotation>360) tokenRotation -= 360
            }
            if (tokenRotation != token.token.rotation) {
                this.dataService.send({name: WSEventName.updateModel, model: "token", data: {id: token.token.id, rotation: tokenRotation}})
            }
            // Center on token
            if (this.kb.keyT)
                this.viewport.animate({ position: token.position, time: 1000, ease: "easeInOutSine", removeOnInterrupt: true })
            // Reset path
            if (this.kb.keyEsc)
                this.dataService.send({name: WSEventName.updateModel, model: "token", data: {id: token.token.id, path: []}})
        }
        // Gamepad Controls
        let gamePads = (window.isSecureContext)? navigator.getGamepads():null;
        if (gamePads&&gamePads[0]) {
            let gp = gamePads[0];
            if (this.gpTS === undefined) {
                this.toastService.showSuccess(`Gamepad connected: ${gp.id}`)
            }
            // R1/L1 Zoom In/Out
            if (gp.buttons[5].pressed)
                this.viewport.animate({ scale: this.viewport.scale.x + 0.1, time: 100 })
            else if (gp.buttons[4].pressed)
                this.viewport.animate({ scale: this.viewport.scale.x - 0.1, time: 100 })
            // R-Joystick Panning:
            if (gp.axes[3] < -.5) {
                pos.y -= 5;
            } else if (gp.axes[3] > .5) {
                pos.y += 5;
            }
            if (gp.axes[2] < -.5) {
                pos.x -= 5;
            } else if (gp.axes[2] > .5) {
                pos.x += 5;
            }
            // Token movement:
            if (token) {
                // L-Joystick + DPad Movement
                if (gp.axes[1] > .5 || gp.buttons[13].pressed) {
                    y += Math.ceil(token.grid.size*.1);
                } else if (gp.axes[1] < -.5 || gp.buttons[12].pressed) {
                    y -= Math.ceil(token.grid.size*.1);
                }
                if (gp.axes[0] > .5 || gp.buttons[15].pressed) {
                    x += Math.ceil(token.grid.size*.1);
                } else if (gp.axes[0] < -.5 || gp.buttons[14].pressed) {
                    x -= Math.ceil(token.grid.size*.1);
                }
                // Token rotation
                let tokenRotation = token.token.rotation
                if (gp.buttons[6].pressed) {
                    tokenRotation -= 5
                    if (tokenRotation<0) tokenRotation += 360
                } else if (gp.buttons[7].pressed) {
                    tokenRotation += 5
                    if (tokenRotation>360) tokenRotation -= 360
                }
                if (tokenRotation != token.token.rotation) {
                    this.dataService.send({name: WSEventName.updateModel, model: "token", data: {id: token.token.id, rotation: tokenRotation}})
                }
                if (gp.timestamp != this.gpTS) {
                    // Center token
                    if (gp.buttons[2].pressed && !this.gpButtons?.[2]?.pressed) {
                        this.viewport.animate({ position: token.position, time: 1000, ease: "easeInOutSine", removeOnInterrupt: true })
                    }
                    // Reset path
                    if (gp.buttons[3].pressed && !this.gpButtons?.[3]?.pressed) {
                        this.dataService.send({name: WSEventName.updateModel, model: "token", data: {id: token.token.id, path: []}})
                    }
                }
            }
            this.gpButtons = JSON.parse(JSON.stringify(gp.buttons));
            this.gpTS = gp.timestamp;
        }
        this.viewport.center = pos;
        if (token) {
            if (token.position.x != x || token.position.y != y) {
                if (!token.blocked) {
                    token.position.set(x,y);
                    this.viewport.moveCenter(x,y);
                }
                if (!token.kbMovement) {
                    token.kbMovement = true
                    token.dragging = true
                    this.dataService.send({name: WSEventName.tokenMoved, data: {id: token.token.id, x: x + (token.w / 2.0) | 0, y: y + (token.h / 2.0) | 0, state: ControlState.start}})
                } else {
                    this.dataService.send({name: WSEventName.tokenMoved, data: {id: token.token.id, x: x + (token.w / 2.0) | 0, y: y + (token.h / 2.0) | 0, state: ControlState.control}})
                }
            } else if (token.kbMovement) {
                token.kbMovement = false;
                token.dragging = false;
                if (!token.blocked) {
                    token.position.set(x,y);
                    this.viewport.moveCenter(x,y);
                }
                this.dataService.send({name: WSEventName.tokenMoved, data: {id: token.token.id, x: x + (token.w / 2.0) | 0, y: y + (token.h / 2.0) | 0, state: ControlState.end}})
            }
        }
      })
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
    if (this.state.runMode != RunMode.normal) {
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
    this.dataService.send({name: WSEventName.clientUpdated, data: {runMode: this.state.runMode, screenWidth: innerWidth, screenHeight: innerHeight}});

    this.trackedObjectsContainer.w = window.innerWidth
    this.trackedObjectsContainer.h = window.innerHeight
    this.trackedObjectsContainer.draw()
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) return
      switch (event.code) {
          case "ArrowUp":
              this.kb.arrowUp = true;
              break;
          case "ArrowDown":
              this.kb.arrowDown = true;
              break;
          case "ArrowLeft":
              this.kb.arrowLeft = true;
              break;
          case "ArrowRight":
              this.kb.arrowRight = true;
              break;
          case "ShiftLeft":
              this.kb.keyShiftL = true;
              break;
          case "ShiftRight":
              this.kb.keyShiftR = true;
              break;
          case "Minus":
              this.kb.keyMinus = true;
              break;
          case "Equal":
              this.kb.keyEqual = true;
              break;
          case "KeyT":
              this.kb.keyT = true;
              break;
          case "Escape":
              this.kb.keyEsc = true;
              break;
      }
  }

  @HostListener('window:keyup', ['$event'])
  onKeyup(event: KeyboardEvent) {
    if (event.target instanceof HTMLInputElement) return
      switch (event.code) {
          case "ArrowUp":
              this.kb.arrowUp = false;
              break;
          case "ArrowDown":
              this.kb.arrowDown = false;
              break;
          case "ArrowLeft":
              this.kb.arrowLeft = false;
              break;
          case "ArrowRight":
              this.kb.arrowRight = false;
              break;
          case "ShiftLeft":
              this.kb.keyShiftL = false;
              break;
          case "ShiftRight":
              this.kb.keyShiftR = false;
              break;
          case "Minus":
              this.kb.keyMinus = false;
              break;
          case "Equal":
              this.kb.keyEqual = false;
              break;
          case "KeyT":
              this.kb.keyT = false;
              break;
          case "Escape":
              this.kb.keyEsc = false;
              break;
          default:
      }
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
