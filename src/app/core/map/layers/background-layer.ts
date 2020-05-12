import * as PIXI from 'pixi.js';
import { Creature } from 'src/app/shared/models/creature';
import { Layer } from './layer';
import { Map } from 'src/app/shared/models/map';
import { environment } from 'src/environments/environment';
import { map } from 'rxjs/operators';
import { Loader } from '../models/loader';
import { DataService } from 'src/app/shared/services/data.service';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { WSEvent } from 'src/app/shared/models/wsevent';
import { ControlState } from '../views/token-view';

export class BackgroundLayer extends Layer {

    imageTexture: PIXI.Texture;
    imageSprite: PIXI.Sprite;
    videoSprite: PIXI.Sprite;

    loadingText = new PIXI.Text("Loading map image...", {fontFamily : 'Arial', fontSize: 18, fill : 0xffffff, align : 'center'});

    image: string;
    video: string;

    data: PIXI.interaction.InteractionData;
    dragging: boolean = false;
    clicked: boolean = false;

    map: Map;

    constructor(private dataService: DataService) {
        super();

        this.interactive = true;

        this
            .on('pointerdown', this.onPointerUp)
            .on('pointerup', this.onPointerDown);
            // .on('pointermove', this.onDragMove);
    }

    update(map: Map) {
        this.map = map;
        this.image = map.image;
        this.scale.set(map.scale, map.scale);
        // this.video = map.video;
    }

    async draw() {
        this.clear();

        if (this.image == null) {
            return this;
        }

        // add loading text
        this.addChild(this.loadingText);
        this.loadingText.anchor.set(0.5, 0.5)
        this.loadingText.position.set(window.innerWidth / 2.0, window.innerHeight / 2);

        // start loading map image
        this.imageTexture = await Loader.shared.loadTexture(this.image);

        // clean loading
        this.removeChildren();

        if(this.imageTexture == null) {
            return this;
        }

        this.w = this.imageTexture.width;
        this.h = this.imageTexture.height;

        let sprite = new PIXI.Sprite(this.imageTexture);
        sprite.width = this.imageTexture.width;
        sprite.height = this.imageTexture.height;
        this.imageSprite = this.addChild(sprite);
        // this.imageSprite.scale = this.scale

        // this.width = this.imageTexture.width;
        // this.height = this.imageTexture.height;

        console.debug(this.width);
        console.debug(this.height);
    }

    clear() {
        this.imageSprite = null;
        this.videoSprite = null
        this.removeChildren();
    }

    double: any;

    onPointerUp(event: PIXI.interaction.InteractionEvent) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        
        if (this.clicked) {
            console.log('double click');
            const newPosition = event.data.getLocalPosition(this.parent);

            // get userr's color
            let color = localStorage.getItem("userColor");

            // send event
            this.dataService.send({name: WSEventName.pointerUpdate, data: {id: this.map.id, x: newPosition.x | 0, y: newPosition.y | 0, color: color, state: ControlState.end}})
            return
        }

        this.clicked = false;
        clearTimeout(this.double)

        this.data = event.data;
        this.dragging = true;
    }
    
    onPointerDown() {
        // console.log('pointer up');
        this.dragging = false;
        // set the interaction data to null
        this.data = null;

        this.clicked = true;
        this.double = setTimeout(() => { this.clicked = false; }, 400); 
    }
    
    onDragMove() {
        if (this.dragging) {
            // console.log('dragging');
            // const newPosition = this.data.getLocalPosition(this.parent);
            // this.x += this.data.global.x - this.x;
            // this.y += this.data.global.y - this.y;
        }
    }

}