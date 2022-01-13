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

  get isTableRoll(): boolean {
    return this.message.type == MessageType.tableRoll;
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

  get tableRollText(): string {
      let getRollValue = (detail) => {
          let val = []
          if (detail.rolls) {
              for (let roll of detail.rolls) {
                  const details = roll.details.map(getRollValue)
                  val = val.concat(details)
              }
          } else {
              // strip internal links
              const detailTxt = detail.value.replaceAll(/<a.*?href="\/.*".*?>(.*?)<\/a>/g,"$1")
              val.push(`${detailTxt}`)
          }
          return val
      }
      const tableRoll = JSON.parse(this.message.content)
      const rolls = [].concat(...tableRoll.details.map(getRollValue))
      if (tableRoll.details.length == 1 && !tableRoll.details[0].rolls) {
        return rolls[0]
      }else {
          return `<ul>${rolls.map(r=>`<li>${r}</li>`).join("")}</ul>`
      }
  }

  ngOnInit(): void {
  }

}
