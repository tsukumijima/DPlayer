import DPlayer from './player';
import * as DPlayerType from '../types/DPlayer';
declare class FullScreen {
    player: DPlayer;
    lastScrollPosition: {
        left: number;
        top: number;
    };
    fullscreenchange: () => void;
    constructor(player: DPlayer);
    isFullScreen(type?: DPlayerType.FullscreenType): boolean;
    request(type?: DPlayerType.FullscreenType): void;
    cancel(type?: DPlayerType.FullscreenType): void;
    toggle(type?: DPlayerType.FullscreenType): void;
    destroy(): void;
}
export default FullScreen;
//# sourceMappingURL=fullscreen.d.ts.map