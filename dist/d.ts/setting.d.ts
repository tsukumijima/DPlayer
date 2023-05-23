import DPlayer from './player';
declare class Setting {
    player: DPlayer;
    loop: boolean;
    showDanmaku: boolean;
    unlimitDanmaku: boolean;
    constructor(player: DPlayer);
    hide(): void;
    show(): void;
}
export default Setting;
//# sourceMappingURL=setting.d.ts.map