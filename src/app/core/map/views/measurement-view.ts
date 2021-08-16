import * as PIXI from 'pixi.js'
import { View } from './view';
import { Grid } from '../models/grid';
import { Measurement } from 'src/app/shared/models/measurement';

export class MeasurementView extends View {
    shape: PIXI.Graphics
    handles: PIXI.Graphics

    constructor(public measurement: Measurement, private grid: Grid) {
        super()
    }

    getPolygon(points: Array<number>): Array<PIXI.Point> {
        var result: Array<PIXI.Point> = []

        for (let i = 0; i < points.length - 1; i = i + 2) {
            result.push(new PIXI.Point(Math.abs(points[i]), Math.abs(points[i+1])))
        }

        return result
    }


    async draw() {
        this.clear()
        
        // create graphics
        this.shape = new PIXI.Graphics()
        this.handles = new PIXI.Graphics()
        this.addChild(this.shape)
        this.addChild(this.handles)

        let color = PIXI.utils.string2hex(this.measurement.color)

        this.shape.lineStyle(4, color)
        
        for(let i = 0; i < this.measurement.data.length; i = i + 2) {
            if (i == 0) {
                this.shape.moveTo(this.measurement.data[i], this.measurement.data[i + 1])
            } else {
                this.shape.lineTo(this.measurement.data[i], this.measurement.data[i + 1])
            }

            this.handles.beginFill(color).drawCircle(this.measurement.data[i], this.measurement.data[i + 1], Math.round(this.grid.size / 12)).endFill()
        }

        
        return this;
    }

    clear() {
        this.shape?.clear()
        this.handles?.clear()
        this.removeChildren()
    }
}