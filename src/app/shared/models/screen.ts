
export enum ScreenInteraction {
    none = "none",
    turn = "turn",
    all = "all",
}

export class Screen {
    interaction: ScreenInteraction;
    overlayImage: string;
    overlayType: string;
}
