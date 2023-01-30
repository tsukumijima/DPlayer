import DPlayer from './player';
declare class HotKey {
    player: DPlayer;
    doHotKeyHandler: (e: KeyboardEvent) => void;
    cancelFullScreenHandler: (e: KeyboardEvent) => void;
    constructor(player: DPlayer);
    doHotKey(e: KeyboardEvent): void;
    cancelFullScreen(e: KeyboardEvent): void;
    destroy(): void;
}
export default HotKey;
//# sourceMappingURL=hotkey.d.ts.map