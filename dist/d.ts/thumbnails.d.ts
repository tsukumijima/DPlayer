import Events from './events';
import DPlayer from './player';
declare class Thumbnails {
    player: DPlayer;
    container: HTMLElement;
    barWidth: number;
    events: Events;
    private readonly viewportWidth;
    private readonly viewportHeight;
    private readonly thumbnailSpace;
    private width;
    private height;
    private interval?;
    private totalCount;
    private columnCount;
    private magnificationScale;
    constructor(options: {
        player: DPlayer;
        url: string;
        events: Events;
        interval?: number;
        totalCount?: number;
        width?: number;
        height?: number;
        columnCount?: number;
    });
    resize(width: number, height: number, barWrapWidth: number): void;
    show(): void;
    move(position: number): void;
    hide(): void;
}
export default Thumbnails;
//# sourceMappingURL=thumbnails.d.ts.map