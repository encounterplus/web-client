import { Map } from 'src/app/shared/models/map';

export class Grid {
    size: number = 50;
    offsetX: number = 0;
    offsetY: number = 0;
    color: string = '#cccccc';
    visible: boolean = true;

    update(map: Map) {
        this.size = map.gridSize;
        this.offsetX = map.gridOffsetX;
        this.offsetY = map.gridOffsetY;
        this.color = map.gridColor;
        this.visible = map.gridVisible;
    }
}