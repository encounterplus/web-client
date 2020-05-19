import { View } from './view';
import { Grid } from '../models/grid';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { Aura } from 'src/app/shared/models/aura';
import { Marker } from 'src/app/shared/models/marker';

export class MarkerView extends View {

    marker: Marker;
    grid: Grid;

    markerTexture: PIXI.Texture;
    markerSprite: PIXI.Sprite;

    nameText: PIXI.Text;

    constructor(marker: Marker, grid: Grid) {
        super();
        this.marker = marker;
        this.grid = grid;
    }

    async draw() {
        this.clear()
        this.update();
        

        // name
        if (this.marker.name && this.marker.name != "") {
            this.nameText = new PIXI.Text(this.marker.name, {fontFamily : 'Arial', fontSize: 30, fill : PIXI.utils.string2hex(this.marker.color), align : 'center', dropShadow: false,
            dropShadowColor: '#000000', dropShadowBlur: 6, dropShadowDistance: 0, stroke: 0xffffff, strokeThickness: 5});
            this.nameText.anchor.set(0.5, 0.5);
            this.nameText.resolution = 4;
            this.addChild(this.nameText);

            this.nameText.position.set(this.w / 2, -this.grid.size / 2);
            this.nameText.style.fontSize = (this.grid.size / 4);
        }
        
        return this;
    }

    update() {
        this.w = this.grid.size;
        this.h = this.grid.size;

        this.position.set(this.marker.x, this.marker.y)
        // this.hitArea = new PIXI.Rectangle(0, 0, this.w, this.h);
        this.visible = !this.marker.hidden;
    }

    clear() {
        this.removeChildren();
    }
}