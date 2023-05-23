import Events from './events';
import * as DPlayerType from './types';
declare class Subtitle {
    container: HTMLElement;
    video: HTMLVideoElement;
    plugins: DPlayerType.Plugins;
    options: DPlayerType.SubtitleInternal;
    events: Events;
    constructor(container: HTMLElement, video: HTMLVideoElement, plugins: DPlayerType.Plugins, options: DPlayerType.SubtitleInternal, events: Events);
    init(): void;
    show(): void;
    hide(): void;
    toggle(): void;
}
export default Subtitle;
//# sourceMappingURL=subtitle.d.ts.map