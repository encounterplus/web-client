import { View } from './view';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { Tile } from 'src/app/shared/models/tile';
import { TilesLayer } from '../layers/tiles-layer';
import { MapLayer } from 'src/app/shared/models/map';

export class TileView extends View {

    tile: Tile;
    grid: Grid;

    assetTexture: PIXI.Texture;
    assetSprite: PIXI.AnimatedSprite;

    mapLayer: MapLayer = MapLayer.object;

    constructor(tile: Tile, grid: Grid) {
        super();
        this.tile = tile;
        this.grid = grid;
    }

    async draw() {
        this.clear()
        this.update();

        await this.drawAsset()
        return this;
    }

    async drawAsset() {
        // texture
        if (this.tile.asset.resource != null) {
            this.assetTexture = await Loader.shared.loadTexture(this.tile.asset.resource);
        } else {
            return this;
        }

        // sprite
        if (this.assetTexture != null) {
	     let frames = [ ];
	     if (this.tile.asset.type == "spriteSheet") {
                for(let x=0,y=0,framecount=0; x < this.assetTexture.baseTexture.width && y < this.assetTexture.baseTexture.height;framecount++) {
                    let rect = new PIXI.Rectangle(x,y,this.tile.asset.frameWidth,this.tile.asset.frameHeight);
                    let frame = new PIXI.Texture(this.assetTexture.baseTexture,rect);
                    frames.push ( frame );
                    x += this.tile.asset.frameWidth;
                    if (x>=this.assetTexture.baseTexture.width) {
                        x = 0;
                        y += this.tile.asset.frameHeight;
		    }
		}
	    } else {
                frames.push(this.assetTexture);
            }
            let sprite = new PIXI.AnimatedSprite(frames);
            sprite.anchor.set(0.5, 0.5);
            sprite.width = this.tile.width;
            sprite.height = this.tile.height;
	        sprite.angle = this.tile.rotation;
	    if (frames.length > 1) {
              if (this.tile.asset.duration === undefined) {
                this.tile.asset.duration = 1.0;
              }
	      sprite.animationSpeed = frames.length/this.tile.asset.duration/60.00;
	      sprite.play();
            }
            this.addChild(sprite);
            this.assetSprite = sprite;
        let ticker = PIXI.Ticker.shared;
        for (let x=0; x < this.tile.components.length; x++) {
            let component = this.tile.components[x];
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

        this.w = this.tile.width;
        this.h = this.tile.height;

        this.position.set(this.tile.x, this.tile.y)
        this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.zIndex = this.tile.zIndex;

        this.visible = !this.tile.hidden;
        this.mapLayer = this.tile.layer;
    }

    clear() {
        this.removeChildren();
    }
}
