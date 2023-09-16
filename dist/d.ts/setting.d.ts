import DPlayer from './player';
declare class Setting {
    player: DPlayer;
    loop: boolean;
    showDanmaku: boolean;
    unlimitDanmaku: boolean;
    currentAudio: 'primary' | 'secondary';
    resizeObserver: ResizeObserver;
    constructor(player: DPlayer);
    hide(): void;
    show(): void;
    destroy(): void;
}
export default Setting;
//# sourceMappingURL=setting.d.ts.map