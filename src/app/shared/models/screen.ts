
export enum ScreenInteraction {
    none = "none",
    token = "token",
    all = "all",
}

export class Screen {
    interaction: ScreenInteraction
    overlayImage: string
    overlayType: string
    sharedVision: boolean
}
