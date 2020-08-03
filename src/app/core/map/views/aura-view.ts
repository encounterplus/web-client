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
            this.addChild(sprite);
            this.assetSprite = sprite;
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
        let ticker = PIXI.Ticker.shared;
        for (let x=0; x < this.aura.components.length; x++) {
            let component = this.aura.components[x];
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
                            if (sprite.rotation + step <= cto && !isrev) {
                                sprite.rotation += step;
                                if (component.autoreverse && sprite.rotation + step >= cto) {
                                    isrev = true;
                                } else if (component.repeat && sprite.rotation + step >= cto) {
                                    loopcount += 1;
                                }
                            } else if (sprite.rotation - step >= cfrom && isrev) {
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
                        sprite.scale.set(cfrom*(this.w/sprite.texture.frame.width));
                        ticker.add(() => {
                            if (component.repeat && loopcount >= component.repeat) {
                                return
                            }
                            let sf = this.w/sprite.texture.frame.width;
                            let step = ((cto*sf) - (cfrom*sf)) / ((1000/ticker.deltaMS)*duration);
                            if (sprite.scale.x + step <= cto*sf && !isrev) {
                                sprite.scale.set( sprite.scale.x + step );
                                if (component.autoreverse && sprite.scale.x + step >= cto*sf) {
                                    isrev = true;
                                } else if (component.repeat && sprite.scale.x + step >= cto*sf) {
                                    loopcount += 1;
                                }
                            } else if (sprite.scale.x - step >= cfrom*sf && isrev) {
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
                            if (sprite.alpha + step <= cto && !isrev) {
                                sprite.alpha += step;
                                if (component.autoreverse && sprite.alpha + step >= cto) {
                                    isrev = true;
                                } else if (component.repeat && sprite.alpha + step >= cto) {
                                    loopcount += 1;
                                }
                            } else if (sprite.alpha - step >= cfrom && isrev) {
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
        this.alpha = this.aura.opacity;
    }

    clear() {
        this.removeChildren();
    }
}
