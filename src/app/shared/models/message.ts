export enum MessageType {
    chat = "cone",
    roll = "roll"
}

export class Message {
    id: string;
    type: MessageType;
    source: string;
    color: string;
    creature: string;
    content: any;
    created: Date;
}