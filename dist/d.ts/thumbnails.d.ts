import Events from './events';
declare class Thumbnails {
    container: HTMLElement;
    barWidth: number;
    events: Events;
    constructor(options: {
        container: HTMLElement;
        barWidth: number;
        url: string;
        events: Events;
    });
    resize(width: number, height: number, barWrapWidth: number): void;
    show(): void;
    move(position: number): void;
    hide(): void;
}
export default Thumbnails;
//# sourceMappingURL=thumbnails.d.ts.map