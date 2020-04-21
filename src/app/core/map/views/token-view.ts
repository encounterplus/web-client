
import { Creature } from 'src/app/shared/models/creature';
import { View } from './view';
import { Sprite, interaction } from 'pixi.js';
import { environment } from 'src/environments/environment';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';

function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num;
}

export class TokenView extends View {

    creature: Creature;
    grid: Grid;

    tokenTexture: PIXI.Texture;
    tokenSprite: PIXI.Sprite;
    // tokenClip: boolean = false;

    uidGraphics: PIXI.Graphics;
    uidText: PIXI.Text;

    data: PIXI.interaction.InteractionData;
    dragging: boolean = false;

    
    selected: boolean = false;
    turned: boolean = false;

    get color(): number {
        if (this.turned) {
            return 0xff9500;
        } else if (this.creature.type == "monster") {
            return 0x631515;
        } else if (this.creature.type == "player") {
            return 0x3F51B5;
        } else {
            return 0xFFCCFFCC;
        }
    }

    constructor(creature: Creature, grid: Grid) {
        super();
        this.creature = creature;
        this.grid = grid;

        this.interactiveChildren = false
        this.interactive = true;
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
        return this;
    }

    async drawToken() {
        // texture
        // this.tokenTexture = await this.loadTexture('/assets/img/token.png');
        
        if (this.creature.cachedToken != null) {
            this.tokenTexture = await Loader.shared.loadTexture(this.creature.cachedToken);
        } else if (this.creature.token != null) {
            this.tokenTexture = await Loader.shared.loadTexture(this.creature.token);
        } else {
            this.tokenTexture = null;
        }

        // // stroke
        // let graphics = new PIXI.Graphics();
        // graphics.lineStyle(1, 0xcccccc, 0.8).drawRoundedRect(-1, -1, this.w+1, this.h+1, 4);
        // this.addChild(graphics);

        // sprite
        if (this.tokenTexture != null) {
            let sprite = new PIXI.Sprite(this.tokenTexture);
            sprite.anchor.set(0.5, 0.5);
            this.tokenSprite = this.addChild(sprite);
        }

        // uid
        this.uidGraphics = new PIXI.Graphics();
        this.addChild(this.uidGraphics);

        this.uidText = new PIXI.Text(this.creature.uid, {fontFamily : 'Arial', fontSize: 24, fill : 0xffffff, align : 'center'});
        this.uidText.anchor.set(0.5, 0.5);
        this.uidText.resolution = 2;
        this.addChild(this.uidText);

        this.updateToken();
        this.updateUID();
    }

    update() {
        
        // this.x = this.creature.x;
        // this.y = this.creature.y;
        this.w = this.grid.size * this.creature.scale;
        this.h = this.grid.size * this.creature.scale;

        this.position.set(this.creature.x - (this.w / 2), this.creature.y - (this.h / 2));
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
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

    updateUID() {
        // this.uidText.width = this.w;
        // this.uidText.height = this.h;

        // this.uidGraphics.position.set(this.w / 2, this.h / 2);

        console.debug("updating UID");

        if (this.tokenTexture != null ) {
            let badgeSize = this.grid.size * 0.4;
            // new position
            var x = (this.w / 2) + (this.w / 2) * Math.cos(45 * (Math.PI / 180));
            var y = (this.w / 2) + (this.w / 2) * Math.cos(45 *  (Math.PI / 180));
            x = clamp(x, 0, (this.w) - (badgeSize / 2));
            y = clamp(y, 0, (this.h) - (badgeSize / 2));

            this.uidGraphics.clear();
            this.uidGraphics.beginFill(this.color).drawCircle(x, y, badgeSize / 2).endFill();
            // this.uidGraphics.cacheAsBitmap = true;

            this.uidText.position.set(x, y);
            this.uidText.style.fontSize = badgeSize / 2.5;
            
        } else {
            this.uidGraphics.clear();
            this.uidGraphics.beginFill(this.color).drawCircle(this.w / 2, this.h / 2, this.w / 2).endFill();
            // this.uidGraphics.cacheAsBitmap = true;
            this.uidText.position.set(this.w / 2, this.h / 2);
            this.uidText.style.fontSize = this.height / 2.5;
        }
    }

    clear() {
        this.removeChildren();
    }

    onDragStart(event: interaction.InteractionEvent) {

        event.stopPropagation();

        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.dragging = true;
    }
    
    onDragEnd() {
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
    }
    
    onDragMove() {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(this.parent);

            this.position.set(newPosition.x - (this.w / 2), newPosition.y - (this.h / 2));
        }
    }

}