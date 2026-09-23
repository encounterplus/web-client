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
    overlayImage: string
    overlayHandoutStyle: string
    overlayHandountText: string
    overlayHandoutText: string
    interaction: ScreenInteraction
    sharedVision: SharedVision
    tableTopMode: boolean
    scrollLock: boolean
    width: number
    height: number
}

export function emptyScreen(): Screen {
    return {
        overlayImage: "",
        overlayHandoutStyle: "",
        overlayHandountText: "",
        overlayHandoutText: "",
        interaction: ScreenInteraction.none,
        sharedVision: SharedVision.never,
        tableTopMode: false,
        scrollLock: false,
        width: 0,
        height: 0,
    }
}
