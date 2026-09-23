export enum MessageType {
    chat = "chat",
    roll = "roll",
    command = "command",
    tableRoll = "tableRoll"
}

export interface Message {
    id: string
    type: MessageType
    source?: string
    color?: string
    creature?: string
    content?: any
    // A locally composed message carries a real Date; one that arrives over the
    // websocket carries the serialized string. Angular's `date` pipe renders
    // either, so both forms are allowed rather than silently mistyped.
    created: string | Date
}
