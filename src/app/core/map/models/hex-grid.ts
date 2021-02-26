import { Grid, GridInterface } from "./grid";
import { Hex, OffsetCoord, Orientation } from "./hex";
import { GridStyle, GridType, Map } from 'src/app/shared/models/map';
import { GridSize } from "../views/token-view";

export class HexGrid extends Grid implements GridInterface {

    orientation: Orientation = Orientation.flat

    update(map: Map) {
        super.update(map)
        this.orientation = (map.gridType == GridType.hexFlat) ? Orientation.flat : Orientation.pointy
    }

    get blockSize(): PIXI.ISize {
        if (this.orientation == Orientation.flat) {
            return {width: 2.0 * this.size, height: Math.sqrt(3) * this.size}
        } else {
            return {width: Math.sqrt(3) * this.size, height: 2.0 * this.size}
        }
    }

    get adjustedSize(): PIXI.ISize {
        return {width: Math.sqrt(3) * this.size * 0.8, height: Math.sqrt(3) * this.size * 0.8}
    }

    hex(point: PIXI.Point): Hex {
        var M:Orientation = this.orientation;
        var pt:PIXI.Point = new PIXI.Point((point.x - this.offsetX) / this.size, (point.y - this.offsetY) / this.size);
        var q:number = M.b0 * pt.x + M.b1 * pt.y;
        var r:number = M.b2 * pt.x + M.b3 * pt.y;
        return new Hex(q, r, -q - r);
    }

    center(hex: Hex):PIXI.Point {
        var M:Orientation = this.orientation;
        var x:number = (M.f0 * hex.q + M.f1 * hex.r) * this.size;
        var y:number = (M.f2 * hex.q + M.f3 * hex.r) * this.size;
        return new PIXI.Point(x + this.offsetX, y + this.offsetY);
    }

    offset(corner: number, size: number):PIXI.Point {
        var M:Orientation = this.orientation;
        var angle:number = 2.0 * Math.PI * (M.start_angle - corner) / 6.0;
        return new PIXI.Point(size * Math.cos(angle), size * Math.sin(angle));
    }

    polygon(hex: Hex): PIXI.Point[] {
        var corners:PIXI.Point[] = [];
        var center:PIXI.Point = this.center(hex);
        for (var i = 0; i < 6; i++) {
            var offset:PIXI.Point = this.offset(i, this.size);
            corners.push(new PIXI.Point(center.x + offset.x, center.y + offset.y));
        }
        return corners;
    }
    
    gridGraphics(width: number, height: number): PIXI.Graphics {
        let cols = 0
        let rows = 0
        
        // caclulate number of cols and rows
        if (this.orientation == Orientation.flat) {
            cols = Math.round(width / (2.0 * 3/4 * this.size)) + 1
            rows = Math.round(height / (Math.sqrt(3.0) * this.size)) + 1
        } else {
            cols = Math.round(width / (Math.sqrt(3.0) * this.size)) + 1
            rows = Math.round(height / (2.0 * 3/4 *this.size)) + 1
        }

        // calculate offset based on grid size
        let offsetCols = Math.round(this.offsetX / this.size)
        let offsetRows = Math.round(this.offsetY / this.size)

        let graphics = new PIXI.Graphics();
        graphics.lineStyle(1.0, PIXI.utils.string2hex(this.color), this.opacity * 0.8, 0.5, false)
        // TODO: implement corners style with dashed line

        // this could be more effecient
        for (var i = -1 - offsetCols; i < cols + 1 - offsetCols; i++) {
            for (var j = -1 - offsetRows; j < rows + 1 - offsetRows; j++) {
                let coord = new OffsetCoord(i, j)
                let hex = this.orientation == Orientation.flat ? OffsetCoord.qoffsetToCube(OffsetCoord.EVEN, coord) : OffsetCoord.roffsetToCube(OffsetCoord.EVEN, coord)

                let polygon = this.polygon(hex)

                graphics.moveTo(polygon[1].x, polygon[1].y)
                graphics.lineTo(polygon[2].x, polygon[2].y)
                graphics.lineTo(polygon[3].x, polygon[3].y)
                graphics.lineTo(polygon[4].x, polygon[4].y)                
            }
        }

        console.debug("rendering hex grid")

        return graphics
    }

    sizeFromGridSize(gridSize: GridSize): PIXI.ISize {
        if (this.orientation == Orientation.flat) {
            return {width: (2.0 * this.size * 3/4 * gridSize.width) + (this.size / 2.0), height: Math.sqrt(3) * this.size * gridSize.height }
        } else {
            return {width: Math.sqrt(3) * this.size * gridSize.width, height: (2.0 * this.size * 3/4 * gridSize.height) + (this.size / 2.0) }
        }
    }
}