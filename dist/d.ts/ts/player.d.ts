import Template from './template';
import Danmaku from './danmaku';
import Events from './events';
import FullScreen from './fullscreen';
import User from './user';
import Subtitle from './subtitle';
import Bar from './bar';
import Timer from './timer';
import Bezel from './bezel';
import Controller from './controller';
import Setting from './setting';
import Comment from './comment';
import HotKey from './hotkey';
import ContextMenu from './contextmenu';
import InfoPanel from './info-panel';
import * as DPlayerType from '../types/DPlayer';
declare class DPlayer {
    bar: Bar;
    bezel: Bezel;
    comment: Comment | null;
    contextmenu: ContextMenu;
    controller: Controller;
    danmaku: Danmaku | null;
    events: Events;
    fullScreen: FullScreen;
    hotkey: HotKey;
    infoPanel: InfoPanel;
    setting: Setting;
    subtitle: Subtitle | null;
    template: Template;
    timer: Timer;
    user: User;
    container: HTMLElement;
    containerClickFun: () => void;
    docClickFun: () => void;
    focus: boolean;
    narrow: boolean;
    noticeTime: number | null;
    options: DPlayerType.OptionsInternal;
    paused: boolean;
    plugins: DPlayerType.Plugins;
    prevVideo: HTMLVideoElement | null;
    quality: DPlayerType.VideoQualityInternal | null;
    qualityIndex: number | null;
    switchingQuality: boolean;
    resizeObserver: ResizeObserver;
    tran: (text: string) => string;
    type: DPlayerType.VideoType | string;
    video: HTMLVideoElement;
    /**
     * DPlayer constructor function
     *
     * @param {Object} options - See README
     * @constructor
     */
    constructor(options: DPlayerType.Options);
    /**
     * Seek video
     */
    seek(time: number): void;
    /**
     * Sync video (live only)
     */
    sync(quiet?: boolean): void;
    /**
     * Play video
     */
    play(fromNative?: boolean): void;
    /**
     * Pause video
     */
    pause(fromNative?: boolean): void;
    switchVolumeIcon(): void;
    /**
     * Set volume
     */
    volume(percentage?: number | string, nostorage?: boolean, nonotice?: boolean): number;
    /**
     * Toggle between play and pause
     */
    toggle(): void;
    /**
     * attach event
     */
    on(name: DPlayerType.Events, callback: (info?: any) => void): void;
    /**
     * Switch to a new video
     *
     * @param {Object} video - new video info
     * @param {Object} danmaku - new danmaku info
     */
    switchVideo(video: {
        url: string;
        type?: DPlayerType.VideoType | string;
        pic?: string;
    }, danmakuAPI?: DPlayerType.Danmaku): void;
    initMSE(video: HTMLVideoElement, type: DPlayerType.VideoType | string): void;
    initVideo(video: HTMLVideoElement, type: DPlayerType.VideoType | string): void;
    switchQuality(index: number): void;
    notice(text: string, time?: number, opacity?: number): void;
    resize(): void;
    speed(rate: number): void;
    destroy(): void;
    static get version(): string;
}
export default DPlayer;
//# sourceMappingURL=player.d.ts.map