import DPlayer from './player';
import Template from './template';
declare class InfoPanel {
    player: DPlayer;
    container: HTMLElement;
    template: Template;
    video: HTMLVideoElement;
    beginTime: number;
    constructor(player: DPlayer);
    show(): void;
    hide(): void;
    toggle(): void;
    update(): void;
    fps(value: number): void;
}
export default InfoPanel;
//# sourceMappingURL=info-panel.d.ts.map