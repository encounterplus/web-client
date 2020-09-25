import { Component, OnInit, Input, ElementRef, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Lightbox } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';
import { Message, MessageType } from 'src/app/shared/models/message';
import { WSEventName } from 'src/app/shared/models/wsevent';

@Component({
  selector: 'app-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss']
})
export class MessageListComponent implements OnInit {

  @Input()
  public state: AppState;

  private scrollContainer: any;
  isNearBottom: boolean = true;

  @ViewChild('scrollframe', {static: false}) scrollFrame: ElementRef;
  @ViewChild('messageinputarea', {static: true}) messageInputArea: ElementRef;
  @ViewChildren('message') itemElements: QueryList<any>;

  messageInput: string = "";

  get messages(): Array<Message> {
    return this.state.messages;
  }

  constructor(private element: ElementRef, private lightbox: Lightbox, private dataService: DataService) {
  }

  onEnter() {
    this.sendMessage();
  }

    quickRoll(r) {
        let rollStr = ""
        const rollRE = /^(\/r(?:oll)? )?(([0-9]+)[dD]([0-9]+)|0)?(?:(kh|kl)1?)?((?:\+|\-)[0-9]+)? ?(.*)?/;
        const m = rollRE.exec(this.messageInput);
        if (this.messageInput != "" && m == null) {
            return;
        }
        const [ cmd, roll, num, sides, keep, mods, text ] = m.slice(1);

        rollStr = cmd || "/roll ";

        let mod=0
        if (mods) {
            mod = Number(mods)
        }
        if (r == "-") {
            mod -= 1;
        } else if (r == "+") {
            mod += 1;
        }

        if (roll) {
            if (r == sides) {
                rollStr += (Number(num)+1).toString() + "d" + sides;
            } else if (!isNaN(r)) {
                if (r == "adv" || r == "dis" || keep) {
                    rollStr += "2d" + r;
                } else {
                    rollStr += "1d" + r;
                }
            } else {
                if ((r == "adv" || r == "dis" || keep) && Number(num) == 1) {
                    rollStr += "2d" + sides;
                } else {
                    rollStr += roll;
                }
            }
        } else if (!isNaN(r)) {
            rollStr += "1d" + r;
        } else if (mod != 0||keep||r=="adv"||r=="dis") {
            rollStr += "0"
        }

        if (keep) {
            if (r == "adv" && keep != "kh") {
                rollStr += "kh1";
            } else if (r == "dis" && keep != "kl") {
                rollStr += "kl1";
            } else if (r != "adv" && r != "dis") {
                rollStr += keep;
            }
        } else if (r == "adv") {
            rollStr += "kh1";
        } else if (r == "dis") {
            rollStr += "kl1";
        }

        if (mod > 0) {
            rollStr += "+" + mod.toString();
        } else if (mod < 0) {
            rollStr += mod.toString();
        }

        if (text) {
            if (/\[.*\]/.exec(text)) {
                rollStr += " " + text;
            } else {
                rollStr += " [" + text + "]";
            }
        }
        this.messageInput = rollStr;

        //this.sendMessage();
    }

  sendMessage() {
    let text = this.messageInput || "";
    this.messageInput = "";

    if(text.trim() == "") {
      return;
    }

    if (text == "/help" || text == "/h") {
      let message = new Message();
      message.type = MessageType.chat;
      message.source = "Help Command";
      message.color = "#6e7ed7";
      message.content = "Dice roll command:</br><code>/r[oll] &lt;dice notation&gt; [[title[:check|save|attack|damage]]]</code>" +
      "Examples:<br>" +
      "<code>" + 
      "/r 2d20kh — advantage\n" +
      "/r 2d20kl — disadvantage\n" +
      "/r 4d6dl — drop lowest\n" +
      "<br>" +
      "/r 1d20+3 [initiative]\n" +
      "/r 1d20+3 [cha:save]\n" +
      "/r 1d20+3 [acrobatics:check]\n" +
      "/r 1d20+3 [dagger:attack]\n" +
      "/r 1d4+3 [dagger:damage]" +
      "</code>";
      this.dataService.state.messages.push(message);
      return;
    }

    console.log("sending message: " + text);

    let name = localStorage.getItem("userName") || "Unknown";
    let color = localStorage.getItem("userColor");

    let message = new Message();
    message.source = name;
    message.color = color;

    if (text.startsWith("/")) {
      message.type = MessageType.command;
      message.content = text
    } else {
      message.type = MessageType.chat;
      message.content = text;
    }
    this.dataService.send({name: WSEventName.createMessage, data: message});
    this.scrollToBottom();
  }

  private onItemElementsChanged(): void {
    // this.scrollToBottom();
    if (this.isNearBottom) {
      this.scrollToBottom();
    }
  }

  public scrollToBottom(): void {
    this.scrollContainer.scroll({
      top: this.scrollContainer.scrollHeight,
      left: 0,
      behavior: 'smooth'
    });
  }

  public scrollToBottomInstant(): void {
    this.scrollContainer.scroll({
      top: this.scrollContainer.scrollHeight,
      left: 0
    });
  }

  private isUserNearBottom(): boolean {
    const threshold = 150;
    const position = this.scrollContainer.scrollTop + this.scrollContainer.offsetHeight;
    const height = this.scrollContainer.scrollHeight;
    return position > height - threshold;
  }

  scrolled(event: any): void {
    this.isNearBottom = this.isUserNearBottom();
  }

  ngAfterViewInit() {
    this.scrollContainer = this.scrollFrame.nativeElement;
    this.itemElements.changes.subscribe(_ => this.onItemElementsChanged());
    this.scrollToBottomInstant();
  }

  ngOnInit(): void {
  }
}
