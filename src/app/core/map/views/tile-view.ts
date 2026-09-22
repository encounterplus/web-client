import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Tile } from 'src/app/shared/models/tile';
import { MapLayer } from 'src/app/shared/models/map';
import { Utils } from 'src/app/shared/utils';
import { AssetSprite, assetSpriteSize, loadAssetSprite } from './asset-sprite';

export class TileView extends View {

    tile: Tile;
    grid: Grid;

    assetSprite: AssetSprite;

    mapLayer: MapLayer = MapLayer.object;

    /** Component animations running on the shared ticker, removed by `clear()`. */
    private tickers: Array<PIXI.TickerCallback<any>> = [];

    /** Bumped by `clear()`, so a draw still loading can tell it has been superseded. */
    private generation = 0;

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
        // asset
        if (this.tile.asset == null) {
            return
        }

        const generation = this.generation;
        let sprite: AssetSprite;
        try {
            sprite = await loadAssetSprite(this.tile.asset);
        } catch (error) {
            console.warn(`failed to load tile asset: ${this.tile.asset.resource}`, error);
            return this;
        }
        if (sprite == null) {
            return this;
        }

        // cleared or disposed while loading; a newer draw shows its own
        if (generation != this.generation || this.destroyed) {
            sprite.destroy();
            return this;
        }

        // sprite
        const size = assetSpriteSize(sprite);
        sprite.anchor.set(0.5, 0.5);
        var scale = Utils.fitScaleFactor(size.width, size.height, this.tile.width, this.tile.height) * (this.tile.scale || 1)
        sprite.width = size.width * scale;
        sprite.height = size.height * scale;
        sprite.angle = this.tile.rotation;
        sprite.alpha = this.tile.opacity
        this.addChild(sprite);
        this.assetSprite = sprite;
        let ticker = PIXI.Ticker.shared;
        for (let x = 0; x < this.tile.components.length; x++) {
            let component = this.tile.components[x];
            if (component.enabled) {
                if (component.type.startsWith("filter.")) {
                    if (component.type == "filter.tint") {
                        sprite.tint = new PIXI.Color(component.color)
                    }
                    if (component.type == "filter.hsb") {
                        let hfilter = new PIXI.ColorMatrixFilter();
                        let sfilter = new PIXI.ColorMatrixFilter();
                        let bfilter = new PIXI.ColorMatrixFilter();

                        hfilter.hue(component.hue, false);
                        sfilter.saturate(component.saturation / 100, false)
                        bfilter.matrix = Utils.brightnessMatrix(component.brightness / 100)
                        sprite.filters = [hfilter, sfilter, bfilter];
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
                        this.addTicker(() => {
                            if (component.repeat && loopcount >= component.repeat) {
                                return
                            }
                            let step = (cto - cfrom) / ((1000 / ticker.deltaMS) * duration);
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
                            } else if (cto < cfrom && sprite.rotation + step >= cto && !isrev) {
                                sprite.rotation += step;
                                if (component.autoreverse && sprite.rotation + step <= cto) {
                                    isrev = true;
                                } else if (component.repeat && sprite.rotation + step <= cto) {
                                    loopcount += 1;
                                }
                            } else if (cto < cfrom && sprite.rotation - step <= cfrom && isrev) {
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
                        sprite.scale.set(cfrom * (this.w / size.width));
                        this.addTicker(() => {
                            if (component.repeat && loopcount >= component.repeat) {
                                return
                            }
                            let sf = this.w / size.width;
                            let step = ((cto * sf) - (cfrom * sf)) / ((1000 / ticker.deltaMS) * duration);
                            if (sprite.scale.x + step <= cto * sf && !isrev) {
                                sprite.scale.set(sprite.scale.x + step);
                                if (component.autoreverse && sprite.scale.x + step >= cto * sf) {
                                    isrev = true;
                                } else if (component.repeat && sprite.scale.x + step >= cto * sf) {
                                    loopcount += 1;
                                }
                            } else if (sprite.scale.x - step >= cfrom * sf && isrev) {
                                sprite.scale.set(sprite.scale.x - step);
                                if (component.autoreverse && sprite.scale.x - step <= cfrom * sf) {
                                    isrev = false;
                                    if (component.repeat) {
                                        loopcount += 1;
                                    }
                                }
                            } else if (cto < cfrom && sprite.scale.x + step >= cto * sf && !isrev) {
                                sprite.scale.set(sprite.scale.x + step);
                                if (component.autoreverse && sprite.scale.x + step <= cto * sf) {
                                    isrev = true;
                                } else if (component.repeat && sprite.scale.x + step <= cto * sf) {
                                    loopcount += 1;
                                }
                            } else if (cto < cfrom && sprite.scale.x - step <= cfrom * sf && isrev) {
                                sprite.scale.set(sprite.scale.x - step)
                                if (component.autoreverse && sprite.scale.x - step >= cfrom * sf) {
                                    isrev = false;
                                    if (component.repeat) {
                                        loopcount += 1;
                                    }
                                }
                            } else {
                                sprite.scale.set(cfrom * sf);
                            }
                        });
                    }
                    if (component.type == "animation.opacity") {
                        sprite.alpha = cfrom;
                        this.addTicker(() => {
                            if (component.repeat && loopcount >= component.repeat) {
                                return
                            }
                            let step = (cto - cfrom) / ((1000 / ticker.deltaMS) * duration);
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
                            } else if (cto < cfrom && sprite.alpha + step >= cto && !isrev) {
                                sprite.alpha += step;
                                if (component.autoreverse && sprite.alpha + step <= cto) {
                                    isrev = true;
                                } else if (component.repeat && sprite.alpha + step <= cto) {
                                    loopcount += 1;
                                }
                            } else if (cto < cfrom && sprite.alpha - step <= cfrom && isrev) {
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

    private addTicker(fn: PIXI.TickerCallback<any>) {
        PIXI.Ticker.shared.add(fn);
        this.tickers.push(fn);
    }

    clear() {
        this.generation += 1;

        this.tickers.forEach(fn => PIXI.Ticker.shared.remove(fn));
        this.tickers = [];

        this.removeChildren();

        // stops a sprite sheet's ticker, and gives a video's shared decoder back
        this.assetSprite?.destroy();
        this.assetSprite = null;
    }

    /** Stops everything this view runs. Call before dropping it. */
    dispose() {
        this.clear();
    }
}
