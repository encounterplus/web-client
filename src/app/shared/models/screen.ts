
export enum ScreenInteraction {
    none = "none",
    token = "token",
    all = "all",
}

export enum SharedVision {
    never = "never",
    partial = "partial",
    always = "always",
}

export class Screen {
    overlayImage: string
    overlayHandoutStyle: string
    overlayHandountText: string
    overlayHandoutText: string
    interaction: ScreenInteraction
    sharedVision: SharedVision
    tableTopMode: Boolean
    scrollLock: Boolean
    width: number
    height: number
}
