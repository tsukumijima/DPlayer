import * as DPlayerType from './types';
declare class Events {
    events: {
        [key: string]: ((info: Event | any) => void)[];
    };
    videoEvents: DPlayerType.VideoEvents[];
    playerEvents: DPlayerType.PlayerEvents[];
    constructor();
    on(name: DPlayerType.Events, callback: (info?: Event | any) => void): void;
    trigger(name: DPlayerType.Events, info?: Event | any): void;
    type(name: DPlayerType.Events): 'player' | 'video' | null;
}
export default Events;
//# sourceMappingURL=events.d.ts.map