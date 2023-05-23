import DPlayer from './player';
declare class ContextMenu {
    contextmenuHandler: (e: MouseEvent) => void;
    player: DPlayer;
    shown: boolean;
    constructor(player: DPlayer);
    show(x: number, y: number): void;
    hide(): void;
    destroy(): void;
}
export default ContextMenu;
//# sourceMappingURL=contextmenu.d.ts.map