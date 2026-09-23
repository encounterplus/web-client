
import * as PIXI from 'pixi.js'
import { View } from './view';
import { Container } from 'pixi.js';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { AuraView } from './aura-view';
import { ScreenInteraction } from 'src/app/shared/models/screen';
import { Role, Size, Token, TokenStyle } from 'src/app/shared/models/token';
import { HexGrid } from '../models/hex-grid';
import { RunMode } from 'src/app/shared/models/app-state';
import { PathView } from './path-view';
import { Asset, AssetLayout } from 'src/app/shared/models/asset';
import { AssetArtwork } from './asset-artwork';

function clamp(num: number, min: number, max: number) {
  return num <= min ? min : num >= max ? max : num
}

export enum ControlState {
  start = 0,
  control = 1,
  end = 2,
  block = 3,
  cancel = 4
}

export interface GridSize {
  readonly width: number
  readonly height: number
}

export class TokenView extends View {

  token: Token
  grid: Grid

  overlayTexture: PIXI.Texture | null = null
  overlaySprite: PIXI.Sprite | null = null

  /** The token's asset or image, with the asset's placement parameters and components; `null` when drawn as a disc. */
  artwork: AssetArtwork | null = null

  labelGraphics: PIXI.Graphics | null = null
  labelText: PIXI.Text | null = null

  elevationGraphics: PIXI.Graphics | null = null
  elevationText: PIXI.Text | null = null

  distanceText: PIXI.Text | null = null

  dragging: boolean = false
  dragStart: number = Date.now()
  kbMovement: boolean = false

  selected: boolean = false
  turned: boolean = false
  controlled: boolean = false
  blocked: boolean = false

  auraContainer: Container = new PIXI.Container()
  auraViews: Array<AuraView> = []
  private auraGeneration = 0
  pathView: PathView
  pointerId?: number | null

  get isPlayer(): boolean {
    return this.token.player || false
    // return this.token.player == true || this.token.role == Role.friendly || false
  }

  get baseColor(): number {
    if (this.token.role === undefined || this.token.role == Role.hostile) {
      return 0x631515;
    } else if (this.token.role == Role.friendly) {
      return 0x3F51B5;
    } else if (this.token.role == Role.neutral) {
      return 0x964B00;
    } else {
      return 0xFFCCFF;
    }
  }

  get color(): number {
    if (this.turned) {
      return 0xff9500;
    } else if (this.defeated) {
      return 0x555555;
    } else if (this.token.role === undefined || this.token.role == Role.hostile) {
      return this.token.trackingId != null ? 0xff3b30 : 0x631515;
    } else if (this.token.role == Role.friendly) {
      return this.token.trackingId != null ? 0x007aff : 0x3F51B5;
    } else if (this.token.role == Role.neutral) {
      return 0x964B00;
    } else {
      return 0xFFCCFF;
    }
  }

  get bloodied(): Boolean {
    return this.token.combatant?.bloodied || false
  }

  get defeated(): Boolean {
    return this.token.combatant?.defeated || false
  }

  get gridSize(): GridSize {
    return { width: this.token.width || 1, height: this.token.height || 1 }
  }

  /** The token's own scale, without the asset's; `resolveLayout` adds that to the artwork. */
  get objectScale(): number {
    return this.token.scale * (this.grid instanceof HexGrid ? 0.8 : 1.0) * (this.token.trackingId != null ? 1.5 : 1.0)
  }

  /** The drawn size of the artwork against the token's cell, for the overlays and labels around it. */
  get scaleFactor(): number {
    return this.objectScale * AssetLayout.scale(this.token.asset)
  }

  get hasArtwork(): boolean {
    return this.artwork != null
  }

  get trackingLabel(): string | null {
    if (!this.token.trackingId) {
      return null
    }
    return this.token.trackingId < 999 ? this.token.trackingId.toString() : (this.token.trackingId % 4096).toString(16)
  }

  get distance(): string | null {
    if (this.token.path && this.token?.path?.length > 2) {
      return `${((this.token.path.length - 2) * 0.5) * this.grid.scale}`
    } else {
      return null
    }
  }

  get elevation(): string | null {
    if (this.token.elevation) {
      return (this.token.elevation || 0) > 0 ? "↑" + Math.abs(this.token.elevation) : "↓" + Math.abs(this.token.elevation)
    } else {
      return null
    }
  }

  constructor(token: Token, grid: Grid, private dataService: DataService) {
    super()
    this.token = token
    this.grid = grid

    this.interactiveChildren = false
    // TODO: add active token selection
    this.eventMode = token.role == Role.friendly ? "static" : "none"
    this.cursor = "pointer"
    this.sortableChildren = true

    this.pathView = new PathView(grid)

    this
      // .on('pointertap', this.onTap)
      .on('pointerdown', this.onDragStart)
      .on('pointerup', this.onDragEnd)
      .on('pointerupoutside', this.onDragEnd)
      .on('pointercancel', this.onDragEnd)
  }

  async draw() {
    this.clear()
    this.update();

    await this.drawToken()
    await this.drawAuras()
    await this.drawPath()

    return this;
  }

  async drawAuras() {
    this.disposeAuras();
    // draw() runs more than once per map update, so an older pass may still be loading
    const generation = this.auraGeneration

    const maxSize = Math.max(this.w, this.h)
    const pixelRatio = this.grid.pixelRatio

    for (let aura of this.token.auras || []) {
      if (!aura.enabled) {
        continue;
      }
      let view = new AuraView(aura, this.grid);

      view.w = (aura.radius * pixelRatio * 2) + maxSize;
      view.h = (aura.radius * pixelRatio * 2) + maxSize;

      await view.draw();
      if (generation != this.auraGeneration) {
        view.dispose();
        return;
      }
      view.position.set(view.w / 2, view.h / 2);
      this.auraContainer.addChild(view);
      this.auraViews.push(view);
    }
  }

  /** Removes the auras and stops what they run — animations, and any video they play. */
  disposeAuras() {
    this.auraGeneration += 1
    this.auraViews.forEach(view => view.dispose())
    this.auraViews = []
    this.auraContainer.removeChildren();
  }

  async drawPath() {
    this.pathView.gridSize = this.gridSize
    this.pathView.color = this.baseColor
    this.pathView.path = this.token.path ?? []
    await this.pathView.draw()
  }

  /**
   * What the token shows: its asset, else its image as a bare asset with no parameters or
   * components. `null` when there is neither, or while tracking — the token then draws as a
   * labelled disc.
   */
  artworkAsset(): Asset | null {
    if (this.token.trackingId != null && this.dataService.state.runMode != RunMode.normal) {
      return null
    }
    if (this.token.asset?.resource != null) {
      return this.token.asset
    }
    if (this.token.image != null) {
      return { resource: this.token.image } as Asset
    }
    return null
  }

  async drawToken() {
    const asset = this.artworkAsset()
    if (asset != null) {
      const artwork = new AssetArtwork(asset)
      this.artwork = artwork
      const drawn = await artwork.loaded

      // cleared while loading, which destroyed this artwork; the draw that cleared it shows its own
      if (this.artwork !== artwork) {
        return
      }
      if (!drawn || this.destroyed) {
        // nothing to show, or nowhere to show it; a failed load draws the disc instead
        artwork.destroy()
        this.artwork = null
        if (this.destroyed) {
          return
        }
      }
    }

    this.w = this.grid.sizeFromGridSize(this.gridSize).width
    this.h = this.grid.sizeFromGridSize(this.gridSize).height

    // artwork
    if (this.artwork != null) {
      this.artwork.visible = !this.defeated
      this.artwork.zIndex = 0
      this.artwork.angle = this.token.rotation || 0
      this.addChild(this.artwork)
    }

    // alpha
    if (this.token.role == Role.friendly) {
      this.alpha = (this.token.hidden) ? 0.5 : 1
    }
    this.updateToken();

    // tracking shape
    if (this.token.trackingId != null && this.dataService.state.runMode != RunMode.normal) {
      let graphics = new PIXI.Graphics();
      graphics.circle(this.w / 2, this.h / 2, this.w * 0.6)
        .fill({ color: 0xffffff, alpha: 0.2 })
        .stroke({ width: 2, color: 0x000000, alpha: 0.2 });

      this.addChild(graphics);
    }

    // overlay
    if (this.defeated) {
      this.overlayTexture = await Loader.shared.loadTexture('/assets/img/corpse.png', true);
      let sprite = new PIXI.Sprite(this.overlayTexture);
      sprite.anchor.set(0.5, 0.5);
      this.addChild(sprite);
      this.overlaySprite = sprite;

      if (this.artwork) {
        this.artwork.visible = false
        // change z order
        this.artwork.zIndex = 0
      }

      this.overlaySprite.zIndex = 1
    } else if (this.bloodied) {
      if (this.token.asset != null || this.token.style == TokenStyle.topdown || this.token.trackingId) {
        this.overlayTexture = await Loader.shared.loadTexture('/assets/img/bloodied.png', true)
        let sprite = new PIXI.Sprite(this.overlayTexture)
        sprite.anchor.set(0.5, 0.5)
        this.addChild(sprite)
        this.overlaySprite = sprite

        // change z order
        if (this.artwork) {
          this.artwork.zIndex = 1
        }
        this.overlaySprite.zIndex = 0
      } else {
        this.overlayTexture = await Loader.shared.loadTexture('/assets/img/token-bloodied.png', true)
        let sprite = new PIXI.Sprite(this.overlayTexture)
        sprite.anchor.set(0.5, 0.5)
        this.addChild(sprite)
        this.overlaySprite = sprite

        // change z order
        if (this.artwork) {
          this.artwork.zIndex = 0
        }
        this.overlaySprite.zIndex = 1
      }
    }

    this.updateOverlay()

    // elevation graphics
    this.elevationGraphics = new PIXI.Graphics();
    this.elevationGraphics.zIndex = 3
    this.addChild(this.elevationGraphics);

    // elevation text
    this.elevationText = new PIXI.Text({ text: "", style: { fontFamily: '-apple-system, Helvetica', fontSize: 24, fontWeight: 'bold', fill: 0xffffff, align: 'center' } });
    this.elevationText.anchor.set(0.5, 0.5);
    this.elevationText.resolution = 4;
    this.elevationText.zIndex = 4
    this.addChild(this.elevationText);

    // label graphics
    this.labelGraphics = new PIXI.Graphics();
    this.labelGraphics.zIndex = 5
    this.addChild(this.labelGraphics);

    // label text
    this.labelText = new PIXI.Text({ text: "", style: { fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: 0xffffff, align: 'center' } });
    this.labelText.anchor.set(0.5, 0.5);
    this.labelText.resolution = 4;
    this.labelText.zIndex = 6
    this.addChild(this.labelText);

    // updates
    this.updateLabel()
    this.updateElevation()
    this.updateTint();
    this.updateInteraction();

    // debug frame
    // let graphics = new PIXI.Graphics()
    // graphics.lineStyle(2, 0xff0000, 1.0)
    // graphics.drawRect(0, 0, this.w, this.h)
    // this.addChild(graphics)
  }

  update() {
    this.w = this.grid.sizeFromGridSize(this.gridSize).width
    this.h = this.grid.sizeFromGridSize(this.gridSize).height

    this.zIndex = this.token.role == Role.friendly ? 50 : 30;

    this.position.set(this.token.x - (this.w / 2), this.token.y - (this.h / 2));
    this.auraContainer.position.set(this.token.x, this.token.y);
    this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);

    // rotation, in degrees; a rotation animation adds to it
    if (this.artwork != null) {
      this.artwork.angle = this.token.rotation || 0
    }

    if (this.token.role == Role.friendly) {
      this.visible = true
    } else {
      this.visible = !this.token.hidden
    }

    this.pathView.visible = this.visible

    if (this.defeated) {
      this.zIndex = 29;
    }
  }

  updateToken() {
    if (this.artwork != null) {
      this.artwork.position.set(this.w / 2, this.h / 2)
      this.artwork.layout({ width: this.w, height: this.h, fit: "aspectFit", scale: this.objectScale })
    }
  }

  updateOverlay() {
    const overlaySprite = this.overlaySprite
    if (this.overlayTexture != null && overlaySprite != null) {
      let size = Math.min(this.w, this.h) * this.scaleFactor
      overlaySprite.width = Math.min(size, this.w)
      overlaySprite.height = Math.min(size, this.h)
      overlaySprite.position.set(this.w / 2, this.h / 2)
    }
  }

  updateLabel() {
    const labelGraphics = this.labelGraphics
    const labelText = this.labelText
    if (labelGraphics == null || labelText == null) {
      return
    }

    // update visibility
    if ((this.hasArtwork && this.token.label != null) || !this.hasArtwork) {
      labelGraphics.visible = true
      labelText.visible = true
    } else {
      labelGraphics.visible = false
      labelText.visible = false
      return
    }

    // get text
    const text = this.token.label || this.trackingLabel || (this.token.name || "Unknown").toUpperCase().charAt(0)

    if (this.hasArtwork || (this.token.trackingId != null && this.dataService.state.runMode != RunMode.normal)) {
      let size = Math.min(this.w, this.h) * clamp(this.scaleFactor, 0.1, 1.0)
      let labelSize = this.grid.adjustedSize.width * 0.4

      // position
      var x: number, y: number

      // grid size check
      if (this.gridSize.width == this.gridSize.height) {
        x = (this.w / 2) - 2 + (size / 2) * Math.cos(45 * (Math.PI / 180))
        y = (this.h / 2) - 2 + (size / 2) * Math.cos(45 * (Math.PI / 180))
      } else {
        x = this.w
        y = this.h
      }

      // clamp
      if (this.token.trackingId != null) {
        x = x * 1.2
        y = y * 1.2
      } else {
        x = clamp(x, 0, (this.w) - (labelSize / 2))
        y = clamp(y, 0, (this.h) - (labelSize / 2))
      }

      labelGraphics.clear();
      labelGraphics.circle(x, y, labelSize / 2)
        .fill(this.color)
        .stroke({ width: 2, color: 0x000000, alpha: 0.2 });

      labelText.text = text
      labelText.position.set(x, y);
      labelText.style.fontSize = labelSize / 2.5;

    } else {
      let size = Math.min(this.w, this.h) * this.scaleFactor
      labelGraphics.clear();
      labelGraphics.circle(this.w / 2, this.h / 2, size / 2)
        .fill(this.color)
        .stroke({ width: 2, color: 0x000000, alpha: 0.2 });
      labelText.text = text
      labelText.position.set(this.w / 2, this.h / 2);
      labelText.style.fontSize = size / 2.5;
    }
  }

  updateElevation() {
    const elevationGraphics = this.elevationGraphics
    const elevationText = this.elevationText
    if (elevationGraphics == null || elevationText == null) {
      return
    }

    // get text
    const text = this.distance || this.elevation

    // update visibility
    if (text) {
      elevationGraphics.visible = true
      elevationText.visible = true
    } else {
      elevationGraphics.visible = false
      elevationText.visible = false
      return
    }

    if (this.token.label != null && this.hasArtwork) {
      let size = Math.min(this.w, this.h) * clamp(this.scaleFactor, 0.1, 1.0)
      let labelSize = this.grid.adjustedSize.width * 0.4

      // position
      var x: number, y: number

      // grid size check
      if (this.gridSize.width == this.gridSize.height) {
        x = (this.w / 2) - 2 - (labelSize * 0.7) - labelSize + (size / 2) * Math.cos(45 * (Math.PI / 180))
        y = (this.h / 2) - 2 - (labelSize / 2) + (size / 2) * Math.cos(45 * (Math.PI / 180))
      } else {
        x = this.w
        y = this.h
      }

      // clamp
      if (this.token.trackingId != null) {
        x = x * 2
        y = y * 1.5
      } else {
        x = clamp(x, 0, (this.w) - (labelSize * 2.2))
        y = clamp(y, 0, (this.h) - (labelSize))
      }

      elevationGraphics.clear()
      elevationGraphics.roundRect(0, 0, labelSize * 2, labelSize, labelSize / 2)
        .fill({ color: this.distance != null ? 0x444444 : 0x555555, alpha: 0.9 })
        .stroke({ width: 2, color: 0x000000, alpha: 0.2 });
      elevationGraphics.position.set(x, y)

      elevationText.text = text
      elevationText.position.set(x + labelSize * 0.7, y + labelSize / 2);
      elevationText.style.fontSize = labelSize / 2.5;

    } else {
      let size = Math.min(this.w, this.h) * clamp(this.scaleFactor, 0.1, 1.0)
      let labelSize = this.grid.adjustedSize.width * 0.4

      // position
      var x: number, y: number

      // grid size check
      if (this.gridSize.width == this.gridSize.height) {
        x = (this.w / 2) - 2 - (labelSize * 0.8) + (size / 2) * Math.cos(45 * (Math.PI / 180))
        y = (this.h / 2) - 2 - (labelSize / 2) + (size / 2) * Math.cos(45 * (Math.PI / 180))
      } else {
        x = this.w
        y = this.h
      }

      // clamp
      if (this.token.trackingId) {
        x = 0 - (x * 0.5)
        y = y * 1.25
      } else {
        x = clamp(x, 0, (this.w) - (labelSize * 1.3))
        y = clamp(y, 0, (this.h) - (labelSize))
      }

      elevationGraphics.clear()
      elevationGraphics.roundRect(0, 0, labelSize * 1.3, labelSize, labelSize / 2)
        .fill({ color: this.distance != null ? 0x444444 : 0x555555, alpha: 0.9 })
        .stroke({ width: 2, color: 0x000000, alpha: 0.2 });
      elevationGraphics.position.set(x, y)

      elevationText.text = text
      elevationText.position.set(x + labelSize * 0.6, y + labelSize / 2);
      elevationText.style.fontSize = labelSize / 2.5;
    }

    if (!this.hasArtwork && this.token.trackingId == null) {
      elevationGraphics.zIndex = 10
      elevationText.zIndex = 11
    }
  }

  updateTint() {
    // on the container, so it multiplies with a tint component on the sprite instead of replacing it
    if (this.artwork) {
      this.artwork.tint = this.controlled ? 0xFFCCCC : 0xFFFFFF;
    }
  }

  updateInteraction() {

    // disable interactions when game is paused
    if (this.dataService.state.paused) {
      this.eventMode = 'none'
      return
    }

    // interactions override
    if (this.dataService.state.allInteractions) {
      this.eventMode = 'static'
      return
    }

    // enable interactions based on screen settings
    switch (this.dataService.state.screen.interaction) {
      case ScreenInteraction.all:
        this.eventMode = this.token.role == Role.friendly ? 'static' : 'none'
        break;

      case ScreenInteraction.token:
        this.eventMode = ((this.token.role == Role.friendly && !this.isPlayer) || (this.token.id == localStorage.getItem("userTokenId"))) ? 'static' : 'none'
        break;

      case ScreenInteraction.none:
        this.eventMode = 'none'
        break;
      default:
        this.eventMode = 'none'
    }
  }

  clear() {
    this.removeChildren();

    // stops its animations, gives a video's shared decoder back, and discards a load in flight
    this.artwork?.destroy()
    this.artwork = null
  }

  /** Stops everything this view runs, auras included. Call before dropping it. */
  dispose() {
    this.disposeAuras()
    this.clear()
  }

  onTap(event: any) {
    // console.debug(`tap, controlling: ${this.controlled}, dragging: ${this.dragging}, pointerId: ${this.pointerId}`)

    if (this.controlled) {
      return
    }
    // stop propagation
    event.stopPropagation()

    if (this.token.reference != null) {
      this.dataService.showEntity(this.token.reference)
    }
  }

  onDragStart(event: any) {
    // console.debug(`drag start, controlling: ${this.controlled}, dragging: ${this.dragging}, pointerId: ${this.pointerId}`)

    if (this.controlled) {
      return
    }
    // stop propagation
    event.stopPropagation()
    this.dragging = true
    this.dragStart = Date.now()

    // update pointerId
    if (event.data.pointerId != null) {
      this.pointerId = event.data.pointerId
    }

    // add pointer move event
    if (this.parent?.parent) {
      this.parent.parent.eventMode = 'static'
    }
    this.parent?.parent?.on('pointermove', this.onDragMove)

    this.dataService.send({ name: WSEventName.tokenMoved, data: { id: this.token.id, x: (this.position.x + (this.w / 2.0)) | 0, y: (this.position.y + (this.h / 2.0)) | 0, state: ControlState.start } })
  }

  onDragEnd(event: any) {
    // console.debug(`drag end, controlling: ${this.controlled}, dragging: ${this.dragging}, pointerId: ${this.pointerId}`)

    // remove pointer move event
    this.parent?.parent?.off('pointermove', this.onDragMove)
    if (this.parent?.parent) {
      this.parent.parent.eventMode = 'passive'
    }

    if (this.controlled) {
      return
    }

    // stop propagation
    event.stopPropagation()
    this.dragging = false
    this.pointerId = null

    this.dataService.send({ name: WSEventName.tokenMoved, data: { id: this.token.id, x: (this.position.x + (this.w / 2.0)) | 0, y: (this.position.y + (this.h / 2.0)) | 0, state: ControlState.end } })

    // click/tap event if time difference between start/end is less than 200ms
    let time = Date.now() - this.dragStart

    // if (time <= 200) {
    //    this.onTap(event)
    // }
  }

  onDragMove = (event: any) => {
    // console.debug(`drag move, controlling: ${this.controlled}, dragging: ${this.dragging}, pointerId: ${this.pointerId}, tokenId: ${this.token.id}`)

    if (this.controlled) {
      return
    }

    if (this.dragging) {
      // console.log(`${this.token.label}: ${event.data.pointerId}, ${event.data.global.x},${event.data.global.y}`)

      // check if pointerId match with event
      if (this.pointerId != null && event.data.pointerId != null) {
        if (this.pointerId == event.data.pointerId) {
          // stop propagation
          event.stopPropagation()
        } else {
          return
        }
      } else {
        // stop propagation
        event.stopPropagation()
      }

      const newPosition = event.data.getLocalPosition(this.parent)

      if (!this.blocked) {
        this.center = newPosition;
        this.auraContainer.position.set(newPosition.x, newPosition.y)
      }

      this.dataService.send({ name: WSEventName.tokenMoved, data: { id: this.token.id, x: newPosition.x | 0, y: newPosition.y | 0, state: ControlState.control } })
    }
  }
}
