import { View } from './view';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { Aura } from 'src/app/shared/models/aura';

export class AuraView extends View {

    aura: Aura;
    grid: Grid;

    assetTexture: PIXI.Texture;
    assetSprite: PIXI.AnimatedSprite;

    shapeGraphics: PIXI.Graphics;

    constructor(aura: Aura, grid: Grid) {
        super();
        this.aura = aura;
        this.grid = grid;
    }

    async draw() {
        this.clear()
        this.update();
        
        await this.drawShape();

        if (this.aura.asset != null) {
            await this.drawAsset();
        }

        return this;
    }

    async drawShape() {
        let graphics = new PIXI.Graphics().lineStyle(1, PIXI.utils.string2hex(this.aura.color));
        graphics.beginFill(PIXI.utils.string2hex(this.aura.color), 0.15);
        graphics.drawCircle(-this.w / 2, -this.h / 2, this.w / 2);
        graphics.endFill();
        this.addChild(graphics);
        this.shapeGraphics = graphics;

        if (this.aura.asset != null) {
            this.shapeGraphics.visible = false;
        } else {
            this.shapeGraphics.visible = true;
        }

        return this;
    }

    async drawAsset() {
        // texture
        if (this.aura.asset.resource != null) {
            this.assetTexture = await Loader.shared.loadTexture(this.aura.asset.resource);
        } else {
            return this;
        }

        // sprite
	if (this.assetTexture != null) {
            let frames = [ ];
            if (this.aura.asset.type == "spriteSheet") {
                for(let x=0,y=0,framecount=0; x < this.assetTexture.baseTexture.width && y < this.assetTexture.baseTexture.height;framecount++) {
                    let rect = new PIXI.Rectangle(x,y,this.aura.asset.frameWidth,this.aura.asset.frameHeight);
                    let frame = new PIXI.Texture(this.assetTexture.baseTexture,rect);
                    frames.push ( frame );
                    x += this.aura.asset.frameWidth;
                    if (x>=this.assetTexture.baseTexture.width) {
                        x = 0;
                        y += this.aura.asset.frameHeight;
                    }
                }
	    } else {
                frames.push(this.assetTexture);
            }
            let sprite = new PIXI.AnimatedSprite(frames);
            
            this.assetSprite = this.addChild(sprite);
            sprite.anchor.set(0.5, 0.5);
            sprite.position.set(-this.w / 2, -this.h / 2)
            sprite.width = this.w;
	    sprite.height = this.h;
            if (frames.length > 1) {
              if (this.aura.asset.duration === undefined) {
                this.aura.asset.duration = 1.0;
              }
	      sprite.animationSpeed = frames.length/this.aura.asset.duration/60.00;
	      sprite.play();
            }
        }

        return this;
    }

    update() {
        this.alpha = this.aura.opacity;
    }

    clear() {
        this.removeChildren();
    }
}
