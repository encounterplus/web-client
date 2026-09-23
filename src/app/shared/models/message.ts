export enum MessageType {
    chat = "chat",
    roll = "roll",
    command = "command",
    tableRoll = "tableRoll"
}

export class Message {
    id: string = "";
    type: MessageType = MessageType.chat;
    source: string = "";
    color: string = "";
    creature: string = "";
    content: any;
    created: Date = new Date();
}
