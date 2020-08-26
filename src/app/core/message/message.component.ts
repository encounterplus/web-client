import { Component, OnInit, Input } from '@angular/core';
import { Message, MessageType } from 'src/app/shared/models/message';
import { DiceRoll, DiceRollType } from 'src/app/shared/models/dice-roll';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  @Input() 
  public message: Message;

  constructor() { }

  get isDiceRoll(): boolean {
    return this.message.type == MessageType.roll && this.message.content != null;
  }

  get isChat(): boolean {
    return this.message.type == MessageType.chat;
  }

  get roll(): DiceRoll {
    return this.message.content as DiceRoll;
  }

  get rollColor(): string {
    switch (this.roll.type) {
        case DiceRollType.attack:
            return "blue";
        case DiceRollType.damage:
            return "red";
        case DiceRollType.heal:
            return "turquoise";
        case DiceRollType.check:
            return "orange";
        case DiceRollType.save:
            return "limeGreen";
        default:
            return "yellow";
    }
}

  ngOnInit(): void {
  }

}
