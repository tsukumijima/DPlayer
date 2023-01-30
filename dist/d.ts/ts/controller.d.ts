import DPlayer from './player';
import Thumbnails from './thumbnails';
declare class Controller {
    player: DPlayer;
    disableAutoHide: boolean;
    autoHideTimer: number;
    mobileSkipTimer: number;
    mobileBackwardTime: number;
    mobileForwardTime: number;
    setAutoHideHandler: () => void;
    thumbnails: Thumbnails | null;
    constructor(player: DPlayer);
    initPlayButton(): void;
    initHighlights(): void;
    initThumbnails(): void;
    initPlayedBar(): void;
    initFullButton(): void;
    initPipButton(): void;
    initVolumeButton(): void;
    initSyncButton(): void;
    initScreenshotButton(): void;
    initAirplayButton(): void;
    initSubtitleButton(): void;
    setAutoHide(time?: number): void;
    show(): void;
    hide(): void;
    isShow(): boolean;
    toggle(): void;
    destroy(): void;
}
export default Controller;
//# sourceMappingURL=controller.d.ts.map