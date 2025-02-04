import Events from './events';
declare class Thumbnails {
    container: HTMLElement;
    barWidth: number;
    events: Events;
    private width;
    private height;
    private totalCount;
    private columnCount;
    constructor(options: {
        container: HTMLElement;
        barWidth: number;
        url: string;
        events: Events;
        duration?: number;
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