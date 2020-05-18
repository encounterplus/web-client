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
import { Pointer } from 'src/app/shared/models/pointer';
import { v4 as uuidv4 } from 'uuid';

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

    activePointer: Pointer;

    constructor(private dataService: DataService) {
        super();

        this.interactive = true;

        this
            .on('pointerup', this.onPointerUp)
            .on('pointerdown', this.onPointerDown)
            .on('pointermove', this.onPointerMove);
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


    onPointerUp(event: PIXI.interaction.InteractionEvent) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        
        
        this.dragging = false;

        if (this.activePointer) {
            event.stopPropagation();
            const newPosition = event.data.getLocalPosition(this.parent);

            this.activePointer.x = newPosition.x | 0;
            this.activePointer.y = newPosition.y | 0;
            this.activePointer.state = ControlState.end;

            // send event
            this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});

            // remove pointer
            this.activePointer = null;
        }
    }
    
    onPointerDown(event: PIXI.interaction.InteractionEvent) {
        if (event.data.originalEvent.shiftKey) {
            event.stopPropagation();
            this.dragging = true;

            const newPosition = event.data.getLocalPosition(this.parent);

            this.activePointer = new Pointer();
            this.activePointer.id = uuidv4();
            this.activePointer.color = localStorage.getItem("userColor");
            this.activePointer.source = localStorage.getItem("userName");
            this.activePointer.x = newPosition.x | 0;
            this.activePointer.y = newPosition.y | 0;
            this.activePointer.state = ControlState.start;

            // send event
            this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});
            return
        }
    }
    
    onPointerMove(event: PIXI.interaction.InteractionEvent) {
        if (this.dragging && this.activePointer) {
            event.stopPropagation();

            const newPosition = event.data.getLocalPosition(this.parent);

            this.activePointer.x = newPosition.x | 0;
            this.activePointer.y = newPosition.y | 0;
            this.activePointer.state = ControlState.control;

            // send event
            this.dataService.send({name: WSEventName.pointerUpdated, data: this.activePointer});
        }
    }
}