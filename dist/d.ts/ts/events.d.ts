import * as DPlayerType from '../types/DPlayer';
declare class Events {
    events: {
        [key: string]: ((info: any) => void)[];
    };
    videoEvents: DPlayerType.VideoEvents[];
    playerEvents: DPlayerType.PlayerEvents[];
    constructor();
    on(name: DPlayerType.Events, callback: (info?: any) => void): void;
    trigger(name: DPlayerType.Events, info?: any): void;
    type(name: DPlayerType.Events): 'player' | 'video' | null;
}
export default Events;
//# sourceMappingURL=events.d.ts.map