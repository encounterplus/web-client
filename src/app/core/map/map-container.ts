import * as PIXI from 'pixi.js';
import { Combatant } from 'src/app/shared/models/combatant';
import { GridType, Map, MapLayer } from 'src/app/shared/models/map';
import { Layer } from './layers/layer';
import { GridLayer } from './layers/grid-layer';
import { BackgroundLayer } from './layers/background-layer';
import { TokensLayer } from './layers/tokens-layer';
import { Grid, GridInterface } from './models/grid';
import { LightsLayer } from './layers/lights-layer';
import { DataService } from 'src/app/shared/services/data.service';
import { AppState } from 'src/app/shared/models/app-state';
import { TokenView, ControlState } from './views/token-view';
import { TilesLayer } from './layers/tiles-layer';
import { AreaEffectsLayer } from './layers/area-effects-layer';
import { AreaEffectView } from './views/area-effect-view';
import { TileView } from './views/tile-view';
import { tileLayer } from 'src/app/shared/models/tile';
import { AurasLayer } from './layers/auras-layer';
import { EffectsLayer } from './layers/effects-layer';
import { DrawingsLayer } from './layers/drawings-layer';
import { MarkersLayer } from './layers/markers-layer';
import { MarkerView } from './views/marker-view';
import { Tool } from '../toolbar/toolbar.component';
import { Pointer } from 'src/app/shared/models/pointer';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { v4 as uuidv4 } from 'uuid';
import { Role } from 'src/app/shared/models/token';
import { SquareGrid } from './models/square-grid';
import { HexGrid } from './models/hex-grid';
import { ProgramManager, Utils } from 'src/app/shared/utils';
import { VisionLayer } from './layers/vision-layer';
import { MeasurementsLayer } from './layers/measurements-layer';
import { MeasurementView } from './views/measurement-view';
import { Measurement, MeasurementType } from 'src/app/shared/models/measurement';
import { PathsLayer } from './layers/paths-layer';
import { View } from './views/view';
import { AreaEffect, AreaEffectShape } from 'src/app/shared/models/area-effect';
import { areaTemplateDimensions } from 'src/app/shared/area-template-tools';
import { LocalAreaTemplateView } from './views/local-area-template-view';
import { AssetVideo } from 'src/app/shared/models/asset';

export class MapContainer extends Layer {

  mapLayer: Layer
  mapTexture!: PIXI.RenderTexture

  backgroundLayer: BackgroundLayer
  gridLayer: GridLayer
  pathsLayer: PathsLayer
  canvasLayer!: Layer
  areaEffectsLayer: AreaEffectsLayer
  monstersLayer: TokensLayer
  playersLayer: TokensLayer

  topLayer: TilesLayer
  middleLayer: TilesLayer
  bottomLayer: TilesLayer

  aurasLayer: AurasLayer
  visionLayer: VisionLayer

  lightsLayer: LightsLayer
  effectsLayer: EffectsLayer
  drawingsLayer: DrawingsLayer
  markersLayer: MarkersLayer
  measurementsLayer: MeasurementsLayer

  overlaySprite: PIXI.Sprite

  // data
  map: Map | undefined;
  state!: AppState;
  grid: Grid = new SquareGrid()

  dragging: boolean = false
  clicked: boolean = false
  dragTarget?: View

  activePointer: Pointer | null = null
  activeMeasurement: Measurement | null = null
  localMeasurementView: MeasurementView | null = null
  savedMeasurementViews: Array<MeasurementView> = []
  measurementType: MeasurementType = MeasurementType.precise
  saveMeasurements: boolean = false
  localMeasurementMapId: string | null = null
  measuring: boolean = false
  areaTemplateShape: AreaEffectShape = AreaEffectShape.sphere
  activeAreaTemplate: AreaEffect | null = null
  localAreaTemplateView: LocalAreaTemplateView | null = null
  localAreaTemplateMapId: string | null = null
  creatingAreaTemplate: boolean = false
  activeTool: Tool | null = null

  turned: TokenView | null = null
  msk: PIXI.Graphics | null = null
  app: PIXI.Application | null = null

  constructor(private dataService: DataService) {
    super();

    // create black overlay
    this.overlaySprite = new PIXI.Sprite(PIXI.Texture.WHITE)
    this.overlaySprite.tint = 0x000000

    this.mapLayer = new Layer()
    this.addChild(this.mapLayer)

    this.backgroundLayer = new BackgroundLayer(this.dataService)
    this.mapLayer.addChild(this.backgroundLayer)
    this.bottomLayer = new TilesLayer(this.dataService)
    this.mapLayer.addChild(this.bottomLayer)
    this.gridLayer = new GridLayer()
    this.mapLayer.addChild(this.gridLayer)
    this.middleLayer = new TilesLayer(this.dataService)
    this.mapLayer.addChild(this.middleLayer)
    this.lightsLayer = new LightsLayer(this.dataService)
    this.addChild(this.lightsLayer)
    this.pathsLayer = new PathsLayer()
    this.addChild(this.pathsLayer)
    this.aurasLayer = new AurasLayer(this.dataService)
    this.addChild(this.aurasLayer)
    this.topLayer = new TilesLayer(this.dataService)
    this.mapLayer.addChild(this.topLayer)
    this.drawingsLayer = new DrawingsLayer(this.dataService)
    this.mapLayer.addChild(this.drawingsLayer)
    this.areaEffectsLayer = new AreaEffectsLayer(this.dataService)
    this.addChild(this.areaEffectsLayer)
    this.measurementsLayer = new MeasurementsLayer(this.dataService)
    this.addChild(this.measurementsLayer)
    this.markersLayer = new MarkersLayer(this.dataService)
    this.addChild(this.markersLayer)
    this.monstersLayer = new TokensLayer(this.dataService)
    this.addChild(this.monstersLayer)
    this.visionLayer = new VisionLayer(this.dataService)
    this.addChild(this.visionLayer)
    this.effectsLayer = new EffectsLayer(this.dataService)
    this.addChild(this.effectsLayer)
    this.playersLayer = new TokensLayer(this.dataService)
    this.addChild(this.playersLayer)

    this.addChild(this.overlaySprite)

    // set default event mode
    this.eventMode = 'passive'

    this
      .on('pointerup', this.onPointerUp)
      .on('pointerupoutside', this.onPointerUp)
      .on('pointerdown', this.onPointerDown)
      // .on('pointermove', this.onPointerMove)
  }

  setActiveTool(tool: Tool) {
    console.debug(`changing active tool ${tool}`)

    this.activeTool = tool
    const usesMapCanvas = this.activeTool == Tool.pointer || this.activeTool == Tool.measure || this.activeTool == Tool.template
    const blocksTokens = this.activeTool == Tool.measure || this.activeTool == Tool.template
    this.eventMode = usesMapCanvas ? "static" : "passive"
    this.interactiveChildren = this.activeTool == Tool.move || blocksTokens
    this.cursor = blocksTokens ? 'crosshair' : 'default'
    this.playersLayer.eventMode = blocksTokens ? 'none' : 'passive'
    this.monstersLayer.eventMode = blocksTokens ? 'none' : 'passive'

    for (const view of this.savedMeasurementViews) {
      view.setDeleteControlVisible(this.activeTool == Tool.measure)
    }

    if (this.activeTool != Tool.measure) {
      this.clearTransientMeasurement()
    }
    if (this.activeTool != Tool.template) {
      this.clearLocalAreaTemplate()
    }
  }

  setMeasurementOptions(type: MeasurementType, save: boolean) {
    this.measurementType = type
    this.saveMeasurements = save

    if (this.activeMeasurement && this.localMeasurementView) {
      this.activeMeasurement.type = type
      this.localMeasurementView.draw()
    }
  }

  setAreaTemplateOptions(shape: AreaEffectShape) {
    const shapeChanged = this.areaTemplateShape != shape
    this.areaTemplateShape = shape

    if (shapeChanged && this.localAreaTemplateView) {
      this.clearLocalAreaTemplate()
    }
  }

  update(state: AppState) {
    this.state = state

    if (this.localMeasurementMapId != null && this.localMeasurementMapId != this.state.map?.id) {
      this.clearAllLocalMeasurements()
    }
    if (this.localAreaTemplateMapId != null && this.localAreaTemplateMapId != this.state.map?.id) {
      this.clearLocalAreaTemplate()
    }

    console.debug("updating map")
    this.map = this.state.map

    if (this.map == null) {
      return
    }

    this.backgroundLayer.update(this.map)


    // if (this.map.video) {
    //     this.backgroundLayer.once('videoloaded', () => this.draw());
    // }

    // create grid
    if (this.map.gridType == GridType.square) {
      this.grid = new SquareGrid()
    } else {
      this.grid = new HexGrid()
    }

    this.grid.update(this.map)
    this.gridLayer.update(this.grid)

    for (const view of [...this.savedMeasurementViews, this.localMeasurementView]) {
      if (view) {
        view.grid = this.grid
        view.draw()
      }
    }

    if (this.localAreaTemplateView) {
      this.localAreaTemplateView.grid = this.grid
      this.localAreaTemplateView.maximumWidth = this.w
      this.localAreaTemplateView.maximumHeight = this.h
      if (this.activeAreaTemplate) this.activeAreaTemplate.width = this.grid.size
      this.localAreaTemplateView.draw()
    }

    this.pathsLayer.grid = this.grid

    this.visionLayer.grid = this.grid
    this.visionLayer.app = this.app
    this.visionLayer.update()
    this.visionLayer.fogLoaded = false

    this.lightsLayer.grid = this.grid
    this.lightsLayer.update()

    this.monstersLayer.grid = this.grid
    this.playersLayer.grid = this.grid
    this.updateTokens()

    this.areaEffectsLayer.update();
    this.areaEffectsLayer.grid = this.grid;

    this.drawingsLayer.update();

    this.effectsLayer.grid = this.grid

    this.markersLayer.grid = this.grid;
    this.markersLayer.update();

    this.measurementsLayer.grid = this.grid
    this.measurementsLayer.update()

    this.updateTiles()
  }

  updateTiles() {
    const map = this.state.map
    if (map == null) {
      return
    }

    this.bottomLayer.tiles = map.tiles.filter(tile => tileLayer(tile) == MapLayer.map);
    this.middleLayer.tiles = map.tiles.filter(tile => tileLayer(tile) == MapLayer.object);
    this.topLayer.tiles = map.tiles.filter(tile => tileLayer(tile) == MapLayer.token);
  }

  updateTokens() {
    const map = this.state.map
    if (map == null) {
      return
    }

    this.monstersLayer.tokens = map.tokens.filter(token => !(token.role == Role.friendly && token.vision && token.vision?.enabled))
    this.playersLayer.tokens = map.tokens.filter(token => token.role == Role.friendly && token.vision && token.vision?.enabled)
  }

  updateTurned(combatant: Combatant | null) {
    if (this.turned != null) {
      this.turned.turned = false;
      this.turned.updateLabel();
      this.turned.updateInteraction();
    }

    if (combatant == null || combatant.tokenId == null) {
      return
    }

    this.turned = this.tokenViewById(combatant.tokenId);
    if (this.turned != null) {
      this.turned.turned = true
      this.turned.updateLabel();
      this.turned.updateInteraction();
    }
  }

  updateInteraction() {
    // console.log(`updating interaction`);

    for (let view of this.playersLayer.views) {
      view.updateInteraction();
    }

    for (let view of this.monstersLayer.views) {
      view.updateInteraction();
    }
  }

  resetPaths() {
    for (let view of this.playersLayer.views) {
      view.token.path = undefined
      view.pathView.clear()
      view.updateElevation()
    }

    for (let view of this.monstersLayer.views) {
      view.token.path = undefined
      view.pathView.clear()
      view.updateElevation()
    }
  }

  async drawTiles() {
    this.bottomLayer.size = this.size
    await this.bottomLayer.draw()

    this.middleLayer.size = this.size
    await this.middleLayer.draw()

    this.topLayer.size = this.size
    await this.topLayer.draw()
  }

  async drawTokens() {
    await this.monstersLayer.draw()
    await this.playersLayer.draw()

    // paths
    this.pathsLayer.tokens = [...this.playersLayer.views, ...this.monstersLayer.views]
    this.pathsLayer.draw()

    // auras: the views are new ones, so the layer holds the aura containers of views now gone
    this.drawAuras()
  }

  drawAuras() {
    this.aurasLayer.size = this.size
    this.aurasLayer.tokens = [...this.playersLayer.views, ...this.monstersLayer.views]
    this.aurasLayer.draw()
  }

  /**
   * Redraws every view showing a video asset, so a change to `Loader.playsVideoAssets` takes
   * effect without reloading the map. Everything else is left alone.
   */
  redrawVideoAssets() {
    for (let layer of [this.bottomLayer, this.middleLayer, this.topLayer]) {
      for (let view of layer.views) {
        if (AssetVideo.isVideo(view.tile.asset)) {
          view.draw()
        }
      }
    }

    for (let view of [...this.playersLayer.views, ...this.monstersLayer.views]) {
      const auraVideo = (view.token.auras || []).some(aura => aura.enabled && AssetVideo.isVideo(aura.asset))
      if (AssetVideo.isVideo(view.token.asset) || auraVideo) {
        view.draw()
      }
    }

    for (let view of this.areaEffectsLayer.views) {
      if (AssetVideo.isVideo(view.areaEffect.asset)) {
        view.draw()
      }
    }
  }

  async draw() {
    console.debug("drawing map container")

    // check for empty map
    if (!this.map) {
      this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h)
      return this
    }

    // preload shaders
    if (ProgramManager.cached.size == 0) {
      await ProgramManager.preload()
    }

    // main background layer
    await this.backgroundLayer.draw()
    // this.backgroundLayer.visible = false

    // update size
    this.w = this.backgroundLayer.w
    this.h = this.backgroundLayer.h

    // update overlay sprite to hide stuff during asset loading
    this.overlaySprite.width = this.w
    this.overlaySprite.height = this.h
    this.overlaySprite.visible = true

    // cleanup otherwise msk will leak memory
    if (this.msk) {
      this.msk.destroy();
      this.msk = null;
    }

    // create new mask
    this.msk = new PIXI.Graphics();
    this.msk.rect(0, 0, this.w, this.h).fill(0xffffff)

    // apply mask
    this.addChild(this.msk)
    this.mask = this.msk

    // map layer
    this.mapLayer.size = this.size

    if (this.mapTexture == null || this.mapTexture.width != this.w || this.mapTexture.height != this.h) {
      this.mapTexture = PIXI.RenderTexture.create({ width: this.w, height: this.h })
      this.visionLayer.mapTexture = this.mapTexture
    }

    // tiles
    await this.drawTiles()

    // grid
    this.gridLayer.size = this.size
    this.gridLayer.draw()

    // render to texture
    this.app?.renderer.render({ container: this.mapLayer, target: this.mapTexture, clear: true })

    // vision
    this.visionLayer.size = this.size
    this.visionLayer.draw()

    // lights
    this.lightsLayer.size = this.size
    this.lightsLayer.draw()

    this.drawingsLayer.size = this.size
    this.drawingsLayer.draw()

    // hide overlay
    this.overlaySprite.visible = false

    // tokens
    this.monstersLayer.size = this.size
    this.playersLayer.size = this.size
    await this.drawTokens()

    // auras
    this.drawAuras()

    this.areaEffectsLayer.size = this.size
    this.areaEffectsLayer.draw()

    this.markersLayer.size = this.size
    this.markersLayer.draw()

    this.measurementsLayer.size = this.size
    this.measurementsLayer.draw()

    this.effectsLayer.size = this.size
    this.effectsLayer.draw()

    // Local rulers must stay above the refreshed map layers and mask so their
    // delete controls remain visible and interactive.
    for (const view of this.savedMeasurementViews) {
      this.addChild(view)
    }
    if (this.localMeasurementView) {
      this.addChild(this.localMeasurementView)
    }
    if (this.localAreaTemplateView) {
      this.localAreaTemplateView.maximumWidth = this.w
      this.localAreaTemplateView.maximumHeight = this.h
      this.localAreaTemplateView.draw()
      this.addChild(this.localAreaTemplateView)
    }

    this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h)
    return this;
  }

  tokenViewById(id: string): TokenView | null {
    for (let view of this.playersLayer.views) {
      if (view.token.id == id) {
        return view
      }
    }

    for (let view of this.monstersLayer.views) {
      if (view.token.id == id) {
        return view
      }
    }

    return null
  }

  tokenViewByTrackingId(id: number): TokenView | null {
    for (let view of this.playersLayer.views) {
      if (view.token.trackingId == id) {
        return view
      }
    }

    for (let view of this.monstersLayer.views) {
      if (view.token.trackingId == id) {
        return view
      }
    }

    return null
  }

  areaEffectViewById(id: string): AreaEffectView | null {
    for (let view of this.areaEffectsLayer.views) {
      if (view.areaEffect.id == id) {
        return view
      }
    }
    return null
  }

  measurementViewById(id: string): MeasurementView | null {
    for (let view of this.measurementsLayer.views) {
      if (view.measurement.id == id) {
        return view
      }
    }
    return null
  }

  tileViewById(id: string): TileView | null {
    for (let view of this.topLayer.views) {
      if (view.tile.id == id) {
        return view
      }
    }
    for (let view of this.middleLayer.views) {
      if (view.tile.id == id) {
        return view
      }
    }

    for (let view of this.bottomLayer.views) {
      if (view.tile.id == id) {
        return view
      }
    }
    return null
  }

  markerViewById(id: string): MarkerView | null {
    for (let view of this.markersLayer.views) {
      if (view.marker.id == id) {
        return view
      }
    }
    return null
  }

  onPointerUp(event: any) {
    if (this.creatingAreaTemplate && this.activeAreaTemplate) {
      event.stopPropagation()
      this.updateLocalAreaTemplate(event)
      this.creatingAreaTemplate = false
      this.off('pointermove', this.onPointerMove)
      this.localAreaTemplateView?.setEditing(false)
      return
    }

    if (this.measuring && this.activeMeasurement) {
      event.stopPropagation();
      this.updateLocalMeasurement(event)
      this.measuring = false
      this.off('pointermove', this.onPointerMove)
      this.finishLocalMeasurement()
      return
    }

    this.dragging = false;
    this.off('pointermove', this.onPointerMove)

    if (this.activePointer) {
      event.stopPropagation();
      const newPosition = event.data.getLocalPosition(this.parent);

      this.activePointer.x = newPosition.x | 0;
      this.activePointer.y = newPosition.y | 0;
      this.activePointer.state = ControlState.end;

      // send event
      this.dataService.send({ name: WSEventName.pointerUpdated, data: this.activePointer });

      // remove pointer
      this.activePointer = null;
    }
  }

  onPointerDown(event: any) {
    if (this.activeTool == Tool.template) {
      event.stopPropagation()
      this.startLocalAreaTemplate(event)
      return
    }

    if (this.activeTool == Tool.measure) {
      event.stopPropagation()
      this.startLocalMeasurement(event)
      return
    }

    // notice: shift key no longer works, as the container event mode is passive by default
    if (event.data.originalEvent.shiftKey || this.activeTool == Tool.pointer) {
      event.stopPropagation();
      this.dragging = true;
      this.on('pointermove', this.onPointerMove)

      const newPosition = event.data.getLocalPosition(this.parent);

      // check if active pointer is present
      if (this.activePointer) {
        // send event
        this.activePointer.state = ControlState.end;
        this.dataService.send({ name: WSEventName.pointerUpdated, data: this.activePointer });
      }

      this.activePointer = {
        id: uuidv4(),
        x: newPosition.x | 0,
        y: newPosition.y | 0,
        color: Utils.userColor(),
        source: localStorage.getItem("userName") ?? "",
        state: ControlState.start,
      };

      // send event
      this.dataService.send({ name: WSEventName.pointerUpdated, data: this.activePointer });
      return
    }
  }

  onPointerMove(event: any) {
    if (this.creatingAreaTemplate && this.activeAreaTemplate) {
      event.stopPropagation()
      this.updateLocalAreaTemplate(event)
      return
    }

    if (this.measuring && this.activeMeasurement) {
      event.stopPropagation()
      this.updateLocalMeasurement(event)
      return
    }

    if (this.dragging && this.activePointer) {
      event.stopPropagation();

      const newPosition = event.data.getLocalPosition(this.parent);

      // out of bounds
      if (newPosition.x < 0 || newPosition.x > this.w * (this.map?.scale ?? 1) || newPosition.y < 0 || newPosition.y > this.h * (this.map?.scale ?? 1)) {
        this.activePointer.state = ControlState.end;
        // send event
        this.dataService.send({ name: WSEventName.pointerUpdated, data: this.activePointer });
        this.activePointer = null;
        return;
      }

      this.activePointer.x = newPosition.x | 0;
      this.activePointer.y = newPosition.y | 0;
      this.activePointer.state = ControlState.control;

      // send event
      this.dataService.send({ name: WSEventName.pointerUpdated, data: this.activePointer });
    }
  }

  private localPosition(event: any): PIXI.Point {
    const point = typeof event.getLocalPosition === 'function'
      ? event.getLocalPosition(this)
      : event.data.getLocalPosition(this)

    return new PIXI.Point(
      Math.max(0, Math.min(this.w, point.x)),
      Math.max(0, Math.min(this.h, point.y))
    )
  }

  private startLocalMeasurement(event: any) {
    this.clearTransientMeasurement()

    const position = this.localPosition(event)
    const measurement: Measurement = {
      id: uuidv4(),
      type: this.measurementType,
      color: localStorage.getItem('userColor') || '#2f8cff',
      hidden: false,
      data: [position.x, position.y, position.x, position.y],
    }

    this.activeMeasurement = measurement
    this.localMeasurementView = new MeasurementView(measurement, this.grid)
    this.addChild(this.localMeasurementView)
    this.localMeasurementView.draw()
    this.localMeasurementMapId = this.map?.id || null

    this.measuring = true
    this.off('pointermove', this.onPointerMove)
    this.on('pointermove', this.onPointerMove)
  }

  private startLocalAreaTemplate(event: any) {
    this.clearLocalAreaTemplate()

    const position = this.localPosition(event)
    const areaTemplate: AreaEffect = {
      id: uuidv4(),
      shape: this.areaTemplateShape,
      color: localStorage.getItem('userColor') || '#2f8cff',
      x: position.x,
      y: position.y,
      zIndex: 1000,
      opacity: 1,
      angle: 0,
      radius: 0,
      length: 0,
      width: this.grid.size,
      hidden: false,
    }

    this.activeAreaTemplate = areaTemplate
    this.localAreaTemplateView = new LocalAreaTemplateView(areaTemplate, this.grid)
    this.localAreaTemplateView.maximumWidth = this.w
    this.localAreaTemplateView.maximumHeight = this.h
    this.addChild(this.localAreaTemplateView)
    this.localAreaTemplateView.draw()
    this.localAreaTemplateMapId = this.map?.id || null

    this.creatingAreaTemplate = true
    this.off('pointermove', this.onPointerMove)
    this.on('pointermove', this.onPointerMove)
  }

  private updateLocalAreaTemplate(event: any) {
    if (!this.activeAreaTemplate || !this.localAreaTemplateView) return

    const end = this.localPosition(event)
    const dimensions = areaTemplateDimensions(
      this.activeAreaTemplate.shape,
      { x: this.activeAreaTemplate.x, y: this.activeAreaTemplate.y },
      end,
      this.grid.size
    )
    this.activeAreaTemplate.angle = dimensions.angle
    this.activeAreaTemplate.length = dimensions.length
    this.activeAreaTemplate.radius = dimensions.radius
    this.activeAreaTemplate.width = dimensions.width
    this.localAreaTemplateView.draw()
  }

  clearLocalAreaTemplate() {
    const wasCreating = this.creatingAreaTemplate
    this.creatingAreaTemplate = false
    this.activeAreaTemplate = null
    if (wasCreating) {
      this.off('pointermove', this.onPointerMove)
    }

    if (this.localAreaTemplateView) {
      this.removeChild(this.localAreaTemplateView)
      this.localAreaTemplateView.destroy({ children: true })
      this.localAreaTemplateView = null
    }
    this.localAreaTemplateMapId = null
  }

  private updateLocalMeasurement(event: any) {
    if (!this.activeMeasurement || !this.localMeasurementView) return

    const position = this.localPosition(event)
    this.activeMeasurement.data[2] = position.x
    this.activeMeasurement.data[3] = position.y
    this.localMeasurementView.draw()
  }

  private finishLocalMeasurement() {
    this.activeMeasurement = null

    if (!this.saveMeasurements || !this.localMeasurementView) return

    const savedView = this.localMeasurementView
    savedView.setDeleteHandler(() => this.deleteSavedMeasurement(savedView))
    savedView.setDeleteControlVisible(this.activeTool == Tool.measure)
    this.savedMeasurementViews.push(savedView)
    this.localMeasurementView = null
  }

  private deleteSavedMeasurement(view: MeasurementView) {
    const index = this.savedMeasurementViews.indexOf(view)
    if (index < 0) return

    this.savedMeasurementViews.splice(index, 1)
    this.removeChild(view)
    view.destroy({ children: true })

    if (this.savedMeasurementViews.length == 0 && this.localMeasurementView == null) {
      this.localMeasurementMapId = null
    }
  }

  private clearTransientMeasurement() {
    const wasMeasuring = this.measuring
    this.measuring = false
    this.activeMeasurement = null
    if (wasMeasuring) {
      this.off('pointermove', this.onPointerMove)
    }

    if (this.localMeasurementView) {
      this.removeChild(this.localMeasurementView)
      this.localMeasurementView.destroy({ children: true })
      this.localMeasurementView = null
    }
  }

  private clearAllLocalMeasurements() {
    this.clearTransientMeasurement()

    for (const view of this.savedMeasurementViews) {
      this.removeChild(view)
      view.destroy({ children: true })
    }

    this.savedMeasurementViews = []
    this.localMeasurementMapId = null
  }

  // onTokenMove(event: any) {
  //    console.debug(`token move`)
  // }
}
