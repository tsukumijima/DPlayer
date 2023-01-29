interface Document {
    webkitFullscreenElement: Element | null;
    webkitExitFullscreen(): void;
}

interface HTMLElement {
    webkitRequestFullscreen(options?: FullscreenOptions | undefined): void;
}

interface HTMLVideoElement {
    webkitEnterFullscreen(): void;
    webkitExitFullscreen(): void;
    webkitShowPlaybackTargetPicker(): void;
}
