import { View } from './view';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
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
    assetSprite: PIXI.AnimatedSprite;

    shapeGraphics: PIXI.Graphics;
    handlesGraphics: PIXI.Graphics;

    selected: boolean = false;

    constructor(areaEffect: AreaEffect, grid: Grid) {
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
            let frames = [ ];
            if (this.areaEffect.asset.type == "spriteSheet") {
                for(let x=0,y=0,framecount=0; x < this.assetTexture.baseTexture.width && y < this.assetTexture.baseTexture.height;framecount++) {
                    let rect = new PIXI.Rectangle(x,y,this.areaEffect.asset.frameWidth,this.areaEffect.asset.frameHeight);
                    let frame = new PIXI.Texture(this.assetTexture.baseTexture,rect);
                    frames.push ( frame );
                    x += this.areaEffect.asset.frameWidth;
                    if (x>=this.assetTexture.baseTexture.width) {
                        x = 0;
                        y += this.areaEffect.asset.frameHeight;
                    }
                }
	    } else {
                frames.push(this.assetTexture);
            }
            let sprite = new PIXI.AnimatedSprite(frames);
 
            this.addChild(sprite);
            this.assetSprite = sprite;

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
	    if (frames.length > 1) {
              if (this.areaEffect.asset.duration === undefined) {
                this.areaEffect.asset.duration = 1.0;
              }
	      sprite.animationSpeed = frames.length/this.areaEffect.asset.duration/60.00;
	      sprite.play();
            }
            let ticker = PIXI.Ticker.shared;
            for (let x=0; x < this.areaEffect.components.length; x++) {
                let component = this.areaEffect.components[x];
                if (component.enabled) {
                    if (component.type.startsWith("filter.")) {
                        if (component.type == "filter.tint") {
                            sprite.tint = PIXI.utils.string2hex(component.color)
                        }
                        if (component.type == "filter.hsb") {
                            let hfilter = new PIXI.filters.ColorMatrixFilter();
                            let sfilter = new PIXI.filters.ColorMatrixFilter();
                            let bfilter = new PIXI.filters.ColorMatrixFilter();
                            hfilter.hue(component.hue,false);
                            sfilter.saturate(component.saturation/100,true);
                            let l = component.brightness/100;
                            let v = 1 + l
                            bfilter._loadMatrix(
                                [v,0,0,0,l,
                                 0,v,0,0,l,
                                 0,0,v,0,l,
                                 0,0,0,1,0],(l<0));
                            sprite.filters = [hfilter,sfilter,bfilter];
                        }
                    }
                    if (component.type.startsWith("animation.")) {
                        let isrev = false;
                        let loopcount = 0;
                        let duration = component.duration || 1;
                        let cfrom = component.from || 0;
                        let cto = component.to || 0;
                        if (component.type == "animation.rotation") {
                            sprite.rotation = cfrom;
                            ticker.add(() => {
                                if (component.repeat && loopcount >= component.repeat) {
                                    return
                                }
                                let step = (cto - cfrom) / ((1000/ticker.deltaMS)*duration);
                                if (cto>cfrom&&sprite.rotation + step <= cto && !isrev) {
                                    sprite.rotation += step;
                                    if (component.autoreverse && sprite.rotation + step >= cto) {
                                        isrev = true;
                                    } else if (component.repeat && sprite.rotation + step >= cto) {
                                        loopcount += 1;
                                    }
                                } else if (cto>cfrom&&sprite.rotation - step >= cfrom && isrev) {
                                    sprite.rotation -= step;
                                    if (component.autoreverse && sprite.rotation - step <= cfrom) {
                                        isrev = false;
                                        if (component.repeat) {
                                            loopcount += 1;
                                        }
                                    }
                                } else if (cto<cfrom && sprite.rotation + step >= cto && !isrev) {
                                    sprite.rotation += step;
                                    if (component.autoreverse && sprite.rotation + step <= cto) {
                                        isrev = true;
                                    } else if (component.repeat && sprite.rotation + step <= cto) {
                                        loopcount += 1;
                                    }
                                } else if (cto<cfrom&&sprite.rotation - step <= cfrom && isrev) {
                                    sprite.rotation -= step;
                                    if (component.autoreverse && sprite.rotation - step >= cfrom) {
                                        isrev = false;
                                        if (component.repeat) {
                                            loopcount += 1;
                                        }
                                    }
                                } else {
                                    sprite.rotation = cfrom;
                                }
                            });
                        }
                        if (component.type == "animation.scale") {
                            let sf = sprite.width/sprite.texture.frame.width;
                            sprite.scale.set(cfrom*sf);
                            ticker.add(() => {
                                if (component.repeat && loopcount >= component.repeat) {
                                    return
                                }
                                let step = ((cto*sf) - (cfrom*sf)) / ((1000/ticker.deltaMS)*duration);
                                if (cto>cfrom&&sprite.scale.x + step <= cto*sf && !isrev) {
                                    sprite.scale.set( sprite.scale.x + step );
                                    if (component.autoreverse && sprite.scale.x + step >= cto*sf) {
                                        isrev = true;
                                    } else if (component.repeat && sprite.scale.x + step >= cto*sf) {
                                        loopcount += 1;
                                    }
                                } else if (cto>cfrom&&sprite.scale.x - step >= cfrom*sf && isrev) {
                                    sprite.scale.set( sprite.scale.x - step );
                                    if (component.autoreverse && sprite.scale.x - step <= cfrom*sf) {
                                        isrev = false;
                                        if (component.repeat) {
                                            loopcount += 1;
                                        }
                                    }
                                } else if (cto<cfrom&&sprite.scale.x + step >= cto*sf && !isrev) {
                                    sprite.scale.set( sprite.scale.x + step );
                                    if (component.autoreverse && sprite.scale.x + step <= cto*sf) {
                                        console.log("Now reverse");
                                        isrev = true;
                                    } else if (component.repeat && sprite.scale.x + step <= cto*sf) {
                                        loopcount += 1;
                                    }
                                } else if (cto<cfrom&&sprite.scale.x - step <= cfrom*sf && isrev) {
                                    sprite.scale.set( sprite.scale.x - step )
                                    if (component.autoreverse && sprite.scale.x - step >= cfrom*sf) {
                                        isrev = false;
                                        if (component.repeat) {
                                            loopcount += 1;
                                        }
                                    }
                                } else {
                                    sprite.scale.set(cfrom*sf);
                                }
                            });
                        }
                        if (component.type == "animation.opacity") {
                            sprite.alpha = cfrom;
                            ticker.add(() => {
                                if (component.repeat && loopcount >= component.repeat) {
                                    return
                                }
                                let step = (cto - cfrom) / ((1000/ticker.deltaMS)*duration);
                                if (cto>cfrom&&sprite.alpha + step <= cto && !isrev) {
                                    sprite.alpha += step;
                                    if (component.autoreverse && sprite.alpha + step >= cto) {
                                        isrev = true;
                                    } else if (component.repeat && sprite.alpha + step >= cto) {
                                        loopcount += 1;
                                    }
                                } else if (cto>cfrom&&sprite.alpha - step >= cfrom && isrev) {
                                    sprite.alpha -= step;
                                    if (component.autoreverse && sprite.alpha - step <= cfrom) {
                                        isrev = false;
                                        if (component.repeat) {
                                            loopcount += 1;
                                        }
                                    }
                                } else if (cto<cfrom&&sprite.alpha + step >= cto && !isrev) {
                                    sprite.alpha += step;
                                    if (component.autoreverse && sprite.alpha + step <= cto) {
                                        isrev = true;
                                    } else if (component.repeat && sprite.alpha + step <= cto) {
                                        loopcount += 1;
                                    }
                                } else if (cto<cfrom&&sprite.alpha - step <= cfrom && isrev) {
                                    sprite.alpha -= step;
                                    if (component.autoreverse && sprite.alpha - step >= cfrom) {
                                        isrev = false;
                                        if (component.repeat) {
                                            loopcount += 1;
                                        }
                                    }
                                } else {
                                    sprite.alpha = cfrom
                                }
                            });
                        }
                    }
                }
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

    onClick() {
        this.selected = !this.selected;
        this.handlesGraphics.visible = this.selected;

        if (this.areaEffect.asset != null) {
            this.shapeGraphics.visible = this.selected;
        } else {
            this.shapeGraphics.visible = true;
        }
    }
}
