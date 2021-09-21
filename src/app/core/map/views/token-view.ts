
import * as PIXI from 'pixi.js'
import { View } from './view';
import { Container, InteractionEvent } from 'pixi.js';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { AuraView } from './aura-view';
import { ScreenInteraction } from 'src/app/shared/models/screen';
import { Role, Size, Token, TokenStyle } from 'src/app/shared/models/token';
import { HexGrid } from '../models/hex-grid';
import { Utils } from 'src/app/shared/utils';
import { RunMode } from 'src/app/shared/models/app-state';
import { PathView } from './path-view';

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

    overlayTexture: PIXI.Texture
    overlaySprite: PIXI.Sprite

    tokenTexture: PIXI.Texture
    tokenSprite: PIXI.Sprite

    labelGraphics: PIXI.Graphics
    labelText: PIXI.Text

    elevationGraphics: PIXI.Graphics
    elevationText: PIXI.Text

    distanceText: PIXI.Text

    data: PIXI.InteractionData
    dragging: boolean = false

    selected: boolean = false
    turned: boolean = false
    controlled: boolean = false
    blocked: boolean = false

    auraContainer: Container = new PIXI.Container()
    pathView: PathView
    pointerId?: number

    get isPlayer(): boolean {
        return this.token.reference?.includes("/player/") || false
    }

    get baseColor(): number {
        if (this.token.role == Role.hostile) {
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
        } else if (this.token.dead) {
            return 0x555555;
        } else if (this.token.role == Role.hostile) {
            return this.token.trackingId != null ? 0xff3b30 : 0x631515;
        } else if (this.token.role == Role.friendly) {
            return this.token.trackingId != null ? 0x007aff : 0x3F51B5;
        } else if (this.token.role == Role.neutral) {
            return 0x964B00;
        } else {
            return 0xFFCCFF;
        }
    }

    get gridSize(): GridSize {
        return Size.toGridSize(this.token.size)
    }

    get scaleFactor(): number {
        return this.token.scale * (this.grid instanceof HexGrid ? 0.8 : 1.0) * (this.token.asset?.scale || 1.0) * (this.token.trackingId != null ? 1.5 : 1.0)
    }

    get tokenOffset(): PIXI.Point {
        return new PIXI.Point(this.token.asset?.offsetX || 0, this.token.asset?.offsetY || 0)
    }

    get trackingLabel(): string {
        if (!this.token.trackingId) {
            return null
        }
        return this.token.trackingId < 999 ? this.token.trackingId.toString() : (this.token.trackingId % 4096).toString(16)
    }

    get distance(): string {
        if (this.token.path && this.token?.path?.length > 2) {
            return `${((this.token.path.length - 2) * 0.5) * this.grid.scale}`
        } else {
            return null
        }
    }

    get elevation(): string {
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
        this.interactive = token.role == Role.friendly
        this.buttonMode = true;
        this.sortableChildren = true

        this.pathView = new PathView(grid)

        this
            .on('pointerdown', this.onDragStart)
            .on('pointerup', this.onDragEnd)
            .on('pointerupoutside', this.onDragEnd)
            .on('pointermove', this.onDragMove)
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
        this.auraContainer.removeChildren();

        const maxSize = Math.max(this.w, this.h)
        const pixelRatio = this.grid.pixelRatio

        for (let aura of this.token.auras) {
            if (!aura.enabled) {
                continue;
            }
            let view = new AuraView(aura, this.grid);

            view.w = (aura.radius * pixelRatio * 2) + maxSize;
            view.h = (aura.radius * pixelRatio * 2) + maxSize;
            
            await view.draw();
            view.position.set(view.w / 2, view.h / 2);
            this.auraContainer.addChild(view);
        }
    }

    async drawPath() {
        this.pathView.gridSize = this.gridSize
        this.pathView.color = this.baseColor
        this.pathView.path = this.token.path
        await this.pathView.draw()
    }

    async drawToken() {
        if (this.token.cachedImage != null && (this.token.trackingId == null || this.dataService.state.runMode == RunMode.normal)) {
            this.tokenTexture = await Loader.shared.loadTexture(this.token.cachedImage)
        } else if (this.token.asset != null && this.token.asset.resource != null && (this.token.trackingId == null || this.dataService.state.runMode == RunMode.normal)) {
            this.tokenTexture = await Loader.shared.loadTexture(this.token.asset.resource)
        } else {
            this.tokenTexture = null;
        }

        // console.debug(this.token)

        this.w = this.grid.sizeFromGridSize(this.gridSize).width
        this.h = this.grid.sizeFromGridSize(this.gridSize).height

        // sprite
        if (this.tokenTexture != null && (this.token.trackingId == null || this.dataService.state.runMode == RunMode.normal)) {
            let sprite = new PIXI.Sprite(this.tokenTexture)
            sprite.anchor.set(0.5 + (this.tokenOffset.x / 100), 0.5 + (this.tokenOffset.y / 100))
            this.addChild(sprite)
            this.tokenSprite = sprite
            this.tokenSprite.visible = !this.token.dead
            this.tokenSprite.zIndex = 0

            // rotation
            this.tokenSprite.rotation = (this.token.rotation)? this.token.rotation * (Math.PI / 180) : 0;
        }

        // alpha
        if (this.token.role == Role.friendly) {
            this.alpha = (this.token.hidden)? 0.5 : 1
        }
        this.updateToken();

        // tracking shape
        if (this.token.trackingId != null && this.dataService.state.runMode != RunMode.normal) {
            let graphics = new PIXI.Graphics();
            graphics.lineStyle(2, 0x000000, 0.2)
            graphics.beginFill(0xffffff, 0.2).drawCircle(this.w / 2, this.h/2, this.w * 0.6).endFill();

            this.addChild(graphics);
        }

        // overlay
        if (this.token.dead) {
            this.overlayTexture = await Loader.shared.loadTexture('/assets/img/corpse.png', true);
            let sprite = new PIXI.Sprite(this.overlayTexture);
            sprite.anchor.set(0.5, 0.5);
            this.addChild(sprite);
            this.overlaySprite = sprite;
            
            if (this.tokenSprite) {
                this.tokenSprite.visible = false
                // change z order
                this.tokenSprite.zIndex = 0
            }
        
            this.overlaySprite.zIndex = 1
        } else if (this.token.bloodied) {
            if ( this.token.asset != null || this.token.style == TokenStyle.topdown || this.token.trackingId) {
                this.overlayTexture = await Loader.shared.loadTexture('/assets/img/bloodied.png', true)
                let sprite = new PIXI.Sprite(this.overlayTexture)
                sprite.anchor.set(0.5, 0.5)
                this.addChild(sprite)
                this.overlaySprite = sprite

                // change z order
                if (this.tokenSprite) {
                    this.tokenSprite.zIndex = 1
                }
                this.overlaySprite.zIndex = 0
            } else {
                this.overlayTexture = await Loader.shared.loadTexture('/assets/img/token-bloodied.png', true)
                let sprite = new PIXI.Sprite(this.overlayTexture)
                sprite.anchor.set(0.5, 0.5)
                this.addChild(sprite)
                this.overlaySprite = sprite

                // change z order
                if (this.tokenSprite) {
                    this.tokenSprite.zIndex = 0
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
        this.elevationText = new PIXI.Text("", {fontFamily : '-apple-system, Helvetica', fontSize: 24, fontWeight: 'bold', fill: 0xffffff, align : 'center'});
        this.elevationText.anchor.set(0.5, 0.5);
        this.elevationText.resolution = 4;
        this.elevationText.zIndex = 4
        this.addChild(this.elevationText);

        // label graphics
        this.labelGraphics = new PIXI.Graphics();
        this.labelGraphics.zIndex = 5
        this.addChild(this.labelGraphics);

        // label text
        this.labelText = new PIXI.Text("", {fontFamily : 'Arial', fontSize: 24, fontWeight: 'bold', fill: 0xffffff, align : 'center'});
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
        // graphics.lineStyle(1, 0xff00000, 1.0)
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

        // sprite
        if (this.tokenTexture != null && (this.token.trackingId == null || this.dataService.state.runMode == RunMode.normal)) {
            // rotation
            this.tokenSprite.rotation = (this.token.rotation)? this.token.rotation * (Math.PI / 180) : 0;
        }

        if (this.token.role == Role.friendly) {
	        this.visible = true
        } else {
            this.visible = !this.token.hidden
        }

        this.pathView.visible = this.visible

        if (this.token.dead) {
            this.zIndex = 29;
        }
    }

    updateToken() {
        if (this.tokenTexture != null) {
            var scale = Utils.fitScaleFactor(this.tokenTexture.width, this.tokenTexture.height, this.w, this.h) * this.scaleFactor
            this.tokenSprite.width = this.tokenTexture.width * scale
            this.tokenSprite.height = this.tokenTexture.height * scale
            
            this.tokenSprite.anchor.set(0.5 + (this.tokenOffset.x / 100), 0.5 + (this.tokenOffset.y / 100))
            this.tokenSprite.position.set(this.w / 2, this.h / 2);
        }
    }

    updateOverlay() {
        if (this.overlayTexture != null) {
            let size = Math.min(this.w, this.h) * this.scaleFactor
            this.overlaySprite.width = Math.min(size, this.w)
            this.overlaySprite.height = Math.min(size, this.h)
            this.overlaySprite.position.set(this.w / 2, this.h / 2)
        }
    }

    updateLabel() {
        // update visibility
        if ((this.tokenTexture != null && this.token.label != null) || this.tokenTexture == null) {
            this.labelGraphics.visible = true
            this.labelText.visible = true
        } else {
            this.labelGraphics.visible = false
            this.labelText.visible = false
            return
        }

        // get text
        const text = this.token.label || this.trackingLabel || (this.token.name || "Unknown").toUpperCase().charAt(0)

        if (this.tokenTexture != null || (this.token.trackingId != null && this.dataService.state.runMode != RunMode.normal) ) {
            let size = Math.min(this.w, this.h) * clamp(this.scaleFactor, 0.1, 1.0)
            let labelSize = this.grid.adjustedSize.width * 0.4

            // position
            var x: number, y: number

            // grid size check
            if (this.gridSize.width == this.gridSize.height) {
                x = (this.w / 2) - 2 + (size / 2) * Math.cos(45 * (Math.PI / 180))
                y = (this.h / 2) - 2 + (size / 2) * Math.cos(45 *  (Math.PI / 180))
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

            this.labelGraphics.clear();
            this.labelGraphics.lineStyle(2, 0x000000, 0.2)
            this.labelGraphics.beginFill(this.color).drawCircle(x, y, labelSize / 2).endFill();

            this.labelText.text = text
            this.labelText.position.set(x, y);
            this.labelText.style.fontSize = labelSize / 2.5;
            
        } else {
            let size = Math.min(this.w, this.h) * this.scaleFactor
            this.labelGraphics.clear();
            this.labelGraphics.lineStyle(2, 0x000000, 0.2)
            this.labelGraphics.beginFill(this.color).drawCircle(this.w / 2, this.h / 2, size / 2).endFill();
            this.labelText.text = text
            this.labelText.position.set(this.w / 2, this.h / 2);
            this.labelText.style.fontSize = size / 2.5;
        }
    }

    updateElevation() {
        // get text
        const text = this.distance || this.elevation

        // update visibility
        if (text) {
            this.elevationGraphics.visible = true
            this.elevationText.visible = true
        } else {
            this.elevationGraphics.visible = false
            this.elevationText.visible = false
            return
        }

        if (this.token.label != null && this.tokenTexture != null) {
            let size = Math.min(this.w, this.h) * clamp(this.scaleFactor, 0.1, 1.0)
            let labelSize = this.grid.adjustedSize.width * 0.4
            
            // position
            var x: number, y: number

            // grid size check
            if (this.gridSize.width == this.gridSize.height) {
            x = (this.w / 2) - 2 - (labelSize * 0.7) - labelSize + (size / 2) * Math.cos(45 * (Math.PI / 180))
            y = (this.h / 2) - 2 - (labelSize / 2) + (size / 2) * Math.cos(45 *  (Math.PI / 180))
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

            this.elevationGraphics.clear()
            this.elevationGraphics.lineStyle(2, 0x000000, 0.2)
            this.elevationGraphics.beginFill(this.distance != null ? 0x444444 : 0x555555, 0.9).drawRoundedRect(0, 0, labelSize * 2, labelSize, labelSize / 2).endFill();
            this.elevationGraphics.position.set(x, y)

            this.elevationText.text = text
            this.elevationText.position.set(x + labelSize * 0.7, y + labelSize / 2);
            this.elevationText.style.fontSize = labelSize / 2.5;
            
        } else {
            let size = Math.min(this.w, this.h) * clamp(this.scaleFactor, 0.1, 1.0)
            let labelSize = this.grid.adjustedSize.width * 0.4

            // position
            var x: number, y: number

            // grid size check
            if (this.gridSize.width == this.gridSize.height) {
            x = (this.w / 2) - 2 -  (labelSize * 0.8) + (size / 2) * Math.cos(45 * (Math.PI / 180))
            y = (this.h / 2) - 2 - (labelSize / 2) + (size / 2) * Math.cos(45 *  (Math.PI / 180))
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

            this.elevationGraphics.clear()
            this.elevationGraphics.lineStyle(2, 0x000000, 0.2)
            this.elevationGraphics.beginFill(this.distance != null ? 0x444444 : 0x555555, 0.9).drawRoundedRect(0, 0, labelSize * 1.3, labelSize, labelSize / 2).endFill();
            this.elevationGraphics.position.set(x, y)

            this.elevationText.text = text
            this.elevationText.position.set(x + labelSize * 0.6, y + labelSize / 2);
            this.elevationText.style.fontSize = labelSize / 2.5;
        }

        if (this.tokenTexture == null && this.token.trackingId == null) {
            this.elevationGraphics.zIndex = 10
            this.elevationText.zIndex = 11
        }
    }

    updateTint() {
        if (this.tokenSprite) {
            this.tokenSprite.tint = this.controlled ? 0xFFCCCC : 0xFFFFFF;
        }
    }

    updateInteraction() {
        // disable interactions when game is paused
        if (this.dataService.state.game.paused) {
            this.interactive = false
            return
        }

        // interactions override
        if (this.dataService.state.allInteractions) {
            this.interactive = true
            return
        }
        
        // enable interactions based on screen settings
        switch (this.dataService.state.screen.interaction) {
            case ScreenInteraction.all: 
                this.interactive = this.token.role == Role.friendly
                break;

            case ScreenInteraction.token: 
                // this.interactive = (this.token.role == Role.friendly && !this.isPlayer) || (this.turned || !this.dataService.state.game.started) && this.token.id == localStorage.getItem("userTokenId");
                this.interactive = (this.token.role == Role.friendly && !this.isPlayer) || (this.token.id == localStorage.getItem("userTokenId"));
                break;

            case ScreenInteraction.none: 
                this.interactive = false;
                break;
            default:
                this.interactive = false;
        }
    }

    clear() {
        this.removeChildren();
    }

    onDragStart(event: InteractionEvent) {
        if (this.controlled) {
            return
        }
        // stop propagation
        event.stopPropagation()
        this.dragging = true

        // update pointerId
        if (event.data.pointerId != null) {
            this.pointerId = event.data.pointerId
        }

        this.dataService.send({name: WSEventName.tokenMoved, data: {id: this.token.id, x: (this.position.x + (this.w / 2.0)) | 0, y: (this.position.y + (this.h / 2.0)) | 0, state: ControlState.start}})
    }
    
    onDragEnd(event: InteractionEvent) {
        if (this.controlled) {
            return
        }

        // stop propagation
        event.stopPropagation()
        this.dragging = false
        this.pointerId = null

        this.dataService.send({name: WSEventName.tokenMoved, data: {id: this.token.id, x: (this.position.x + (this.w / 2.0)) | 0, y: (this.position.y + (this.h / 2.0)) | 0, state: ControlState.end}})
    }
    
    onDragMove(event: InteractionEvent) {
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
        
            this.dataService.send({name: WSEventName.tokenMoved, data: {id: this.token.id, x: newPosition.x | 0, y: newPosition.y | 0, state: ControlState.control}})
        }
    }
}
