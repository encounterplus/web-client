import { View } from './view';
import { Grid } from '../models/grid';
import { Marker } from 'src/app/shared/models/marker';

export class MarkerView extends View {

    marker: Marker;
    grid: Grid;

    markerGraphics: PIXI.Graphics;
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
            dropShadowColor: '#000000', dropShadowBlur: 6, dropShadowDistance: 0, stroke: 0xffffff, strokeThickness: this.grid.size / 15});
            this.nameText.anchor.set(0.5, 0.5);
            this.nameText.resolution = 4;
            this.addChild(this.nameText);

            this.nameText.position.set(this.w / 2, -this.grid.size / 2.5);
            this.nameText.style.fontSize = (this.grid.size / 3);
        }

        // create graphics
        this.markerGraphics = new PIXI.Graphics();
        this.addChild(this.markerGraphics);

        let scale = this.grid.size / 50
        let color = PIXI.utils.string2hex(this.marker.color);

        this.markerGraphics.beginFill(color)
            .moveTo(25, 0)
            .bezierCurveTo(15.08, 0, 7, 8.13, 7, 18.11)
            .bezierCurveTo(7, 30.5, 23.11, 48.7, 23.11, 48.7)
            .bezierCurveTo(24.44, 50.18, 24.44, 50.18, 25.56, 50.18)
            .bezierCurveTo(26.89, 48.69, 43, 30.5, 43, 18.11)
            .bezierCurveTo(43, 8.13, 34.92, 0, 25, 0)
            .closePath().endFill;
        this.markerGraphics.beginFill(0xffffff).drawCircle(25, 18, 15).endFill();
        if (!this.marker.label) {
            this.markerGraphics.beginFill(color).drawCircle(25, 18, 12).endFill();
        } else {
            let text = new PIXI.Text(this.marker.label, {fontFamily : 'Arial', fontSize: 30, fill : 0x000000, align : 'center'});
            text.anchor.set(0.5, 0.5);
            text.resolution = 4;
            this.addChild(text);

            text.position.set(this.w / 2, this.w / 2.6);
            text.style.fontSize = (this.grid.size / 3);
        }
        this.markerGraphics.scale.set(scale, scale);
        
        return this;
    }

    update() {
        this.w = this.grid.size;
        this.h = this.grid.size;

        this.position.set(this.marker.x - (this.w / 2), this.marker.y - (this.w));
        this.visible = !this.marker.hidden;
    }

    clear() {
        this.removeChildren();
    }
}