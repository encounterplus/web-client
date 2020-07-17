import { Component, OnInit, Input, ElementRef, ViewChildren, QueryList, ViewChild } from '@angular/core';
import { AppState } from 'src/app/shared/models/app-state';
import { Lightbox } from 'ngx-lightbox';
import { DataService } from 'src/app/shared/services/data.service';
import { Message, MessageType } from 'src/app/shared/models/message';
import { WSEventName } from 'src/app/shared/models/wsevent';
import { DiceRoll } from 'src/app/shared/models/dice-roll';

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

  sendMessage() {
    let text = this.messageInput || "";
    this.messageInput = "";

    if(text.trim() == "") {
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
