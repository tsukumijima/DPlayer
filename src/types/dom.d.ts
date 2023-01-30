interface Window {
    WebKitPlaybackTargetAvailabilityEvent?: WebKitPlaybackTargetAvailabilityEvent;
    webkitRequestAnimationFrame?(callback: FrameRequestCallback): number;
    mozRequestAnimationFrame?(callback: FrameRequestCallback): number;
    oRequestAnimationFrame?(callback: FrameRequestCallback): number;
    msRequestAnimationFrame?(callback: FrameRequestCallback): number;
}

interface WebKitPlaybackTargetAvailabilityEvent extends Event {
    availability: 'available' | 'not-available';
}

interface HTMLVideoElementEventMap {
    webkitplaybacktargetavailabilitychanged: WebKitPlaybackTargetAvailabilityEvent;
}

interface Document {
    webkitFullscreenElement: Element | null;
    webkitExitFullscreen(): void;
}

interface HTMLElement {
    webkitRequestFullscreen(options?: FullscreenOptions): void;
}

interface HTMLVideoElement {
    webkitEnterFullscreen(): void;
    webkitExitFullscreen(): void;
    webkitShowPlaybackTargetPicker(): void;
}
