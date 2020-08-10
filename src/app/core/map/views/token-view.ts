
import { Creature, Role } from 'src/app/shared/models/creature';
import { View } from './view';
import { Container, InteractionEvent } from 'pixi.js';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { AuraView } from './aura-view';
import { ScreenInteraction } from 'src/app/shared/models/screen';

function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num;
}

export enum ControlState {
    start = 0,
    control = 1,
    end = 2,
    block = 3,
    cancel = 4
}

export class TokenView extends View {

    creature: Creature;
    grid: Grid;

    overlayTexture: PIXI.Texture;
    overlaySprite: PIXI.Sprite;

    tokenTexture: PIXI.Texture;
    tokenSprite: PIXI.Sprite;
    // tokenClip: boolean = false;

    uidGraphics: PIXI.Graphics;
    uidText: PIXI.Text;

    distanceText: PIXI.Text;

    data: PIXI.InteractionData;
    dragging: boolean = false;

    selected: boolean = false;
    turned: boolean = false;
    controlled: boolean = false;
    blocked: boolean = false;

    distance: string;

    auraContainer: Container = new PIXI.Container();

    get color(): number {
        if (this.turned) {
            return 0xff9500;
        } else if (this.creature.dead) {
            return 0x333333;
        } else if (this.creature.role == Role.hostile) {
            return 0x631515;
        } else if (this.creature.role == Role.friendly) {
            return 0x3F51B5;
        } else if (this.creature.role == Role.neutral) {
            return 0x964B00;
        } else {
            return 0xFFCCFF;
        }
    }

    constructor(creature: Creature, grid: Grid, private dataService: DataService) {
        super();
        this.creature = creature;
        this.grid = grid;

        this.interactiveChildren = false
        this.interactive = creature.role == Role.friendly;
        this.buttonMode = true;

        this
            .on('pointerdown', this.onDragStart)
            .on('pointerup', this.onDragEnd)
            .on('pointerupoutside', this.onDragEnd)
            .on('pointermove', this.onDragMove);
    }

    async draw() {
        this.clear()
        this.update();

        await this.drawToken()
        await this.drawAuras();

        return this;
    }

    async drawAuras() {
        this.auraContainer.removeChildren();

        for (let aura of this.creature.auras) {
            if (!aura.enabled) {
                continue;
            }
            let view = new AuraView(aura, this.grid);
            view.w = ((aura.radius / 5) * this.grid.size * 2) + this.w;
            view.h = ((aura.radius / 5) * this.grid.size * 2) + this.h;
            await view.draw();
            view.position.set(view.w / 2, view.h / 2);
            this.auraContainer.addChild(view);
        }
    }

    async drawToken() {
        if (this.creature.cachedToken != null) {
            this.tokenTexture = await Loader.shared.loadTexture(this.creature.cachedToken);
        } else if (this.creature.token != null) {
            this.tokenTexture = await Loader.shared.loadTexture(this.creature.token);
        } else {
            this.tokenTexture = null;
        }

        this.w = this.grid.size * this.creature.scale;
        this.h = this.grid.size * this.creature.scale;

        // sprite
        if (this.tokenTexture != null) {
            let sprite = new PIXI.Sprite(this.tokenTexture);
            sprite.anchor.set(0.5, 0.5);
            this.addChild(sprite);
            this.tokenSprite = sprite;

            // rotation
            this.tokenSprite.rotation = (this.creature.rotation)? this.creature.rotation * (Math.PI / 180) : 0;
        }

        // alpha
        if (this.creature.role == Role.friendly) {
            this.alpha = (this.creature.hidden)? 0.5 : 1
        }
        this.updateToken();

        // overlay
        if (this.creature.dead) {
            this.overlayTexture = await Loader.shared.loadTexture('/assets/img/token-dead.png', true);
            let sprite = new PIXI.Sprite(this.overlayTexture);
            sprite.anchor.set(0.5, 0.5);
            this.addChild(sprite);
            this.overlaySprite = sprite;
        } else if (this.creature.bloodied) {
            this.overlayTexture = await Loader.shared.loadTexture('/assets/img/token-bloodied.png', true);
            let sprite = new PIXI.Sprite(this.overlayTexture);
            sprite.anchor.set(0.5, 0.5);
            this.addChild(sprite);
            this.overlaySprite = sprite;
        }

        this.updateOverlay();

        // uid
        this.uidGraphics = new PIXI.Graphics();
        this.addChild(this.uidGraphics);

        this.uidText = new PIXI.Text(this.creature.uid, {fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
        this.uidText.anchor.set(0.5, 0.5);
        this.uidText.resolution = 4;
        this.addChild(this.uidText);

        // distance
        this.distanceText = new PIXI.Text(this.distance, {fontFamily : 'Arial', fontSize: 30, fill : 0xffffff, align : 'center', dropShadow: true,
        dropShadowColor: '#000000', dropShadowBlur: 6, dropShadowDistance: 0});
        this.distanceText.anchor.set(0.5, 0.5);
        this.distanceText.resolution = 2;
        this.addChild(this.distanceText);

        this.updateUID();
        this.updateTint();
        this.updateDistance();
        this.updateInteraction();
    }

    update() {
        this.w = this.grid.size * this.creature.scale;
        this.h = this.grid.size * this.creature.scale;

        this.zIndex = this.creature.role == Role.friendly ? 50 : 30;

        this.position.set(this.creature.x - (this.w / 2), this.creature.y - (this.h / 2));
        this.auraContainer.position.set(this.creature.x, this.creature.y);
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);

        if (this.creature.role == Role.friendly) {
	    this.visible = true;
        } else {
            this.visible = !this.creature.hidden;
        }

        if (this.creature.dead) {
            this.zIndex = 29;
        }
    }

    updateToken() {
        if (this.tokenTexture != null) {
            let ratio = this.tokenTexture.width / this.tokenTexture.height;
            let scale = ratio > 1 ?  this.h / this.tokenTexture.height : this.w / this.tokenTexture.width
            this.tokenSprite.width = this.tokenTexture.width * scale;
            this.tokenSprite.height = this.tokenTexture.height * scale;
            this.tokenSprite.position.set(this.w / 2, this.h / 2);
        }
    }

    updateOverlay() {
        if (this.overlayTexture != null) {
            this.overlaySprite.width = this.w;
            this.overlaySprite.height = this.h;
            this.overlaySprite.position.set(this.w / 2, this.h / 2);
        }
    }

    updateUID() {
        if (!this.uidGraphics || !this.uidText) {
            return;
        }

        if (this.tokenTexture != null ) {
            let badgeSize = this.grid.size * 0.4;
            // new position
            var x = (this.w / 2) + (this.w / 2) * Math.cos(45 * (Math.PI / 180));
            var y = (this.w / 2) + (this.w / 2) * Math.cos(45 *  (Math.PI / 180));
            x = clamp(x, 0, (this.w) - (badgeSize / 2));
            y = clamp(y, 0, (this.h) - (badgeSize / 2));

            this.uidGraphics.clear();
            this.uidGraphics.beginFill(this.color).drawCircle(x, y, badgeSize / 2).endFill();

            this.uidText.position.set(x, y);
            this.uidText.style.fontSize = badgeSize / 2.5;
            
        } else {
            this.uidGraphics.clear();
            this.uidGraphics.beginFill(this.color).drawCircle(this.w / 2, this.h / 2, this.w / 2).endFill();
            this.uidText.position.set(this.w / 2, this.h / 2);
            this.uidText.style.fontSize = this.h / 2.5;
        }
    }

    updateDistance() {
        if (this.distance == null && this.distance != "") {
            this.distanceText.visible = false;
        } else {
            this.distanceText.visible = true;
            this.distanceText.text = this.distance;
            this.distanceText.position.set(this.w / 2, -this.grid.size / 2);
            this.distanceText.style.fontSize = (this.grid.size / 4);
        }
    }

    updateTint() {
        if (this.tokenSprite) {
            this.tokenSprite.tint = this.controlled ? 0xFFCCCC : 0xFFFFFF;
        }
    }

    updateInteraction() {
        
        switch (this.dataService.state.screen.interaction) {
            case ScreenInteraction.all: 
                this.interactive = this.creature.role == Role.friendly;
                break;

            case ScreenInteraction.turn: 
                this.interactive = this.creature.role == Role.friendly && (this.turned || !this.dataService.state.game.started);
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

        event.stopPropagation();

        if (this.controlled) {
            return;
        }

        this.data = event.data;
        this.dragging = true;

        this.dataService.send({name: WSEventName.creatureMoved, data: {id: this.creature.id, x: (this.position.x + (this.w / 2.0)) | 0, y: (this.position.y + (this.h / 2.0)) | 0, state: ControlState.start}});
    }
    
    onDragEnd() {
        event.stopPropagation();

        if (this.controlled) {
            return;
        }

        this.dragging = false;
        this.data = null;

        this.dataService.send({name: WSEventName.creatureMoved, data: {id: this.creature.id, x: (this.position.x + (this.w / 2.0)) | 0, y: (this.position.y + (this.h / 2.0)) | 0, state: ControlState.end}});
    }
    
    onDragMove() {
        event.stopPropagation();

        if (this.controlled) {
            return;
        }

        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(this.parent);

            if (!this.blocked) {
                this.center = newPosition;
                this.auraContainer.position.set(newPosition.x, newPosition.y);
            }
        
            this.dataService.send({name: WSEventName.creatureMoved, data: {id: this.creature.id, x: newPosition.x | 0, y: newPosition.y | 0, state: ControlState.control}});
        }
    }
}
