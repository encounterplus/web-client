import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { TrackedObject, TrackedObjectType } from 'src/app/shared/models/tracked-object';
import { Layer } from '../layers/layer';

export class TrackedObjectView extends View {
    trackedObject: TrackedObject

    graphics: PIXI.Graphics

    constructor(trackedObject: TrackedObject) {
        super()
        this.trackedObject = trackedObject
    }

    convert(x: number, y: number): PIXI.Point {
        // const pointOnScreen = new PIXI.Point(x * this.viewport.screenWidth, y * this.viewport.screenHeight)
        // const pointFromCenter = new PIXI.Point(pointOnScreen.x - this.viewport.screenWidth/2, pointOnScreen.y - this.viewport.screenHeight/2)

        // // ugh, somethig easier to understand?
        // let xx = pointFromCenter.x/this.viewport.scale.x + this.viewport.worldWidth/2 + this.viewport.center.x
        // let yy = pointFromCenter.y/this.viewport.scale.x + this.viewport.worldHeight/2 + this.viewport.center.y

        // return new PIXI.Point(xx, yy)

        // console.debug((this.parent as Layer).h)

        return new PIXI.Point(x * (this.parent as Layer).w, y * (this.parent as Layer).h)
        // return new PIXI.Point(x * 1000, y * 1000)
    }

    getPolygon(points: Array<number>): Array<PIXI.Point> {
        var result: Array<PIXI.Point> = []

        for (let i = 0; i < points.length - 1; i = i + 2) {
            result.push(this.convert(points[i], points[i + 1]))
        }

        return result
    }

    get center(): PIXI.Point {
        return this.convert(this.trackedObject.x, this.trackedObject.y)
    }

    async draw() {
        this.clear()
        this.update();
        
        // create graphics
        this.graphics = new PIXI.Graphics()
        this.addChild(this.graphics)

        let color = this.trackedObject.type == TrackedObjectType.pointer ? 0x00FFFF : 0x9a12b3

        this.graphics.lineStyle(2, 0xffffff, 0.8)
        this.graphics.beginFill(color, 0.5).drawPolygon(this.getPolygon(this.trackedObject.contour || [])).endFill().beginHole().drawCircle(this.center.x, this.center.y, 3).endHole()

        
        return this;
    }

    update() {
        this.w = this.width
        this.h = this.height

        // this.position.set(this.marker.x - (this.w / 2), this.marker.y - (this.w));
        // this.visible = !this.marker.hidden;
    }

    clear() {
        this.graphics?.clear()
        this.removeChildren()
    }
}