
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
    overlayImage: string = ""
    overlayHandoutStyle: string = ""
    overlayHandountText: string = ""
    overlayHandoutText: string = ""
    interaction: ScreenInteraction = ScreenInteraction.none
    sharedVision: SharedVision = SharedVision.never
    tableTopMode: Boolean = false
    scrollLock: Boolean = false
    width: number = 0
    height: number = 0
}
