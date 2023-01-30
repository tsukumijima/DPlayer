import DPlayer from './player';
declare class Comment {
    player: DPlayer;
    constructor(player: DPlayer);
    show(): void;
    hide(): void;
    showSetting(): void;
    hideSetting(): void;
    toggleSetting(): void;
    send(): void;
}
export default Comment;
//# sourceMappingURL=comment.d.ts.map