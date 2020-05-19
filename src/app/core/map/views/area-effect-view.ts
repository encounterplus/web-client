import { Creature } from 'src/app/shared/models/creature';
import { View } from './view';
import { Sprite, interaction } from 'pixi.js';
import { environment } from 'src/environments/environment';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEvent, WSEventName } from 'src/app/shared/models/wsevent';
import { Tile } from 'src/app/shared/models/tile';
import { AreaEffect, AreaEffectShape } from 'src/app/shared/models/area-effect';

export function toRadians(degrees: number) {
	return degrees * Math.PI / 180;
}

export function toDegrees(radians: number) {
	return radians * 180 / Math.PI;
}

export class AreaEffectView extends View {

    areaEffect: AreaEffect;
    grid: Grid;

    assetTexture: PIXI.Texture;
    assetSprite: PIXI.Sprite;

    shapeGraphics: PIXI.Graphics;
    handlesGraphics: PIXI.Graphics;

    selected: boolean = false;

    constructor(areaEffect: AreaEffect, grid: Grid, private dataService: DataService) {
        super();
        this.areaEffect = areaEffect;
        this.grid = grid;

        
        this.interactiveChildren = false
        this.interactive = false;
        this.buttonMode = true;

        this
            .on('pointerup', this.onClick)
    }

    get start(): PIXI.Point {
        return new PIXI.Point(this.areaEffect.x, this.areaEffect.y);
    }

    get end(): PIXI.Point {
        return new PIXI.Point(this.start.x + (this.areaEffect.length * Math.cos(this.areaEffect.angle)), this.start.y + (this.areaEffect.length * Math.sin(this.areaEffect.angle)));
    }

    calculateHitArea(): PIXI.IHitArea {
        switch (this.areaEffect.shape) {
            case AreaEffectShape.sphere:
            case AreaEffectShape.cylinder:
                return new PIXI.Circle(this.areaEffect.x, this.areaEffect.y, this.areaEffect.radius)

            case AreaEffectShape.cube:
                // graphics.drawRect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.length / 2), this.areaEffect.length, this.areaEffect.length);
                // graphics.pivot.x = this.areaEffect.x;
                // graphics.pivot.y = this.areaEffect.y;
                // graphics.rotation = this.areaEffect.angle;
                // graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                // break;

            case AreaEffectShape.square:
                // graphics.drawRect(this.areaEffect.x - this.areaEffect.length, this.areaEffect.y - this.areaEffect.length, this.areaEffect.length * 2, this.areaEffect.length * 2);
                // graphics.pivot.x = this.areaEffect.x;
                // graphics.pivot.y = this.areaEffect.y;
                // graphics.rotation = this.areaEffect.angle;
                // graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                // break;
            
            case AreaEffectShape.cone:
                // graphics.moveTo(this.areaEffect.x, this.areaEffect.y);
                // graphics.arc(this.areaEffect.x, this.areaEffect.y, this.areaEffect.length, this.areaEffect.angle - toRadians(26.5), this.areaEffect.angle + toRadians(26.5), false);
                // graphics.lineTo(this.areaEffect.x, this.areaEffect.y);
                // break;

            case AreaEffectShape.line:
                // graphics.drawRect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.width / 2), this.areaEffect.length, this.areaEffect.width);
                // graphics.pivot.x = this.areaEffect.x;
                // graphics.pivot.y = this.areaEffect.y;
                // graphics.rotation = this.areaEffect.angle;
                // graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                // break;
        }

        return null;
    }

    async draw() {
        this.clear()
        this.update();
        
        await this.drawShape();
        await this.drawHandles();

        if (this.areaEffect.asset != null) {
            await this.drawAsset();
        }

        return this;
    }

    async drawShape() {
        let graphics = new PIXI.Graphics().lineStyle(1, PIXI.utils.string2hex(this.areaEffect.color));
        graphics.beginFill(PIXI.utils.string2hex(this.areaEffect.color), 0.3);

        switch (this.areaEffect.shape) {
            case AreaEffectShape.sphere:
            case AreaEffectShape.cylinder:
                graphics.drawCircle(this.areaEffect.x, this.areaEffect.y, this.areaEffect.radius);
                break;

            case AreaEffectShape.cube:
                graphics.drawRect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.length / 2), this.areaEffect.length, this.areaEffect.length);
                graphics.pivot.x = this.areaEffect.x;
                graphics.pivot.y = this.areaEffect.y;
                graphics.rotation = this.areaEffect.angle;
                graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                break;

            case AreaEffectShape.square:
                graphics.drawRect(this.areaEffect.x - this.areaEffect.length, this.areaEffect.y - this.areaEffect.length, this.areaEffect.length * 2, this.areaEffect.length * 2);
                graphics.pivot.x = this.areaEffect.x;
                graphics.pivot.y = this.areaEffect.y;
                graphics.rotation = this.areaEffect.angle;
                graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                break;
            
            case AreaEffectShape.cone:
                graphics.moveTo(this.areaEffect.x, this.areaEffect.y);
                graphics.arc(this.areaEffect.x, this.areaEffect.y, this.areaEffect.length, this.areaEffect.angle - toRadians(26.5), this.areaEffect.angle + toRadians(26.5), false);
                graphics.lineTo(this.areaEffect.x, this.areaEffect.y);
                break;

            case AreaEffectShape.line:
                graphics.drawRect(this.areaEffect.x, this.areaEffect.y - (this.areaEffect.width / 2), this.areaEffect.length, this.areaEffect.width);
                graphics.pivot.x = this.areaEffect.x;
                graphics.pivot.y = this.areaEffect.y;
                graphics.rotation = this.areaEffect.angle;
                graphics.position.set(this.areaEffect.x, this.areaEffect.y);
                break;
        }

        graphics.endFill();
        this.addChild(graphics);
        this.shapeGraphics = graphics;

        if (this.areaEffect.asset != null) {
            this.shapeGraphics.visible = this.selected;
        } else {
            this.shapeGraphics.visible = true;
        }

        return this;
    }

    async drawHandles() {
        let graphics = new PIXI.Graphics().lineStyle(1, 0xffffff);
        graphics.beginFill(PIXI.utils.string2hex(this.areaEffect.color));
        graphics.drawCircle(this.start.x, this.start.y, 5);
        graphics.drawCircle(this.end.x, this.end.y, 5);
        graphics.endFill();
        this.addChild(graphics);

        graphics.visible = this.selected;
        this.handlesGraphics = graphics;

        return this;
    }

    async drawAsset() {
        // texture
        if (this.areaEffect.asset.resource != null) {
            this.assetTexture = await Loader.shared.loadTexture(this.areaEffect.asset.resource);
        } else {
            return this;
        }

        // sprite
        if (this.assetTexture != null) {
            let sprite = new PIXI.Sprite(this.assetTexture);
            
            this.assetSprite = this.addChild(sprite);

            switch (this.areaEffect.shape) {
                case AreaEffectShape.sphere:
                case AreaEffectShape.cylinder:
                    sprite.anchor.set(0.5, 0.5);
                    sprite.position.set(this.areaEffect.x, this.areaEffect.y)
                    sprite.width = this.areaEffect.radius * 2;
                    sprite.height = this.areaEffect.radius * 2;
                    sprite.rotation = this.areaEffect.angle;
                    break;
                case AreaEffectShape.cube:
                case AreaEffectShape.cone:
                    sprite.anchor.set(0, 0.5);
                    sprite.position.set(this.areaEffect.x, this.areaEffect.y)
                    sprite.width = this.areaEffect.length;
                    sprite.height = this.areaEffect.length;
                    sprite.rotation = this.areaEffect.angle;
                    break;
                case AreaEffectShape.line:
                    sprite.position.set(this.areaEffect.x, this.areaEffect.y)
                    sprite.width = this.areaEffect.length;
                    sprite.height = this.areaEffect.width;
                    sprite.rotation = this.areaEffect.angle;
                    break;
            }
        }

        return this;
    }

    update() {

        // this.w = this.tile.width;
        // this.h = this.tile.height;

        // this.position.set(this.tile.x, this.tile.y)
        // this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.zIndex = this.areaEffect.zIndex;
        this.alpha = this.areaEffect.opacity;
        this.hitArea = this.calculateHitArea();

        this.visible = !this.areaEffect.hidden;
    }

    clear() {
        this.removeChildren();
    }

    onClick(event: interaction.InteractionEvent) {
        this.selected = !this.selected;
        this.handlesGraphics.visible = this.selected;

        if (this.areaEffect.asset != null) {
            this.shapeGraphics.visible = this.selected;
        } else {
            this.shapeGraphics.visible = true;
        }
        
    }
}