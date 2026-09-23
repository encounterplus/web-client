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

export interface Screen {
    overlayImage?: string
    overlayHandoutStyle: string
    overlayHandoutText?: string
    interaction: ScreenInteraction
    sharedVision: SharedVision
    tableTopMode: boolean
    scrollLock: boolean
    width: number
    height: number
}
