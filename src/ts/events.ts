import * as DPlayerType from './types';

class Events {
    events: {[key: string]: {callback: (info?: Event | any) => void; once: boolean}[]};
    videoEvents: DPlayerType.VideoEvents[];
    playerEvents: DPlayerType.PlayerEvents[];

    constructor() {
        this.events = {};

        this.videoEvents = [
            'abort',
            'canplay',
            'canplaythrough',
            'durationchange',
            'emptied',
            'ended',
            'error',
            'loadeddata',
            'loadedmetadata',
            'loadstart',
            'mozaudioavailable',
            'pause',
            'play',
            'playing',
            'progress',
            'ratechange',
            'seeked',
            'seeking',
            'stalled',
            'suspend',
            'timeupdate',
            'volumechange',
            'waiting',
        ];
        this.playerEvents = [
            'screenshot',
            'thumbnails_show',
            'thumbnails_hide',
            'danmaku_show',
            'danmaku_hide',
            'danmaku_clear',
            'danmaku_load_start',
            'danmaku_load_end',
            'danmaku_send',
            'danmaku_opacity',
            'contextmenu_show',
            'contextmenu_hide',
            'notice_show',
            'notice_hide',
            'quality_start',
            'quality_end',
            'destroy',
            'resize',
            'fullscreen',
            'fullscreen_cancel',
            'webfullscreen',
            'webfullscreen_cancel',
            'subtitle_show',
            'subtitle_hide',
            'subtitle_change',
        ];
    }

    on(name: DPlayerType.Events, callback: (info?: Event | any) => void, once = false): void {
        if (this.type(name) && typeof callback === 'function') {
            if (!this.events[name]) {
                this.events[name] = [];
            }
            this.events[name].push({
                callback,
                once,
            });
        }
    }

    off(name: DPlayerType.Events, callback: (info?: Event | any) => void): void {
        if (this.type(name) && typeof callback === 'function' && this.events[name]) {
            for (const event of this.events[name]) {
                if (event.callback === callback) {
                    this.events[name].splice(this.events[name].indexOf(event), 1);
                }
            }
        }
    }

    trigger(name: DPlayerType.Events, info?: Event | any): void {
        if (this.events[name] && this.events[name].length) {
            for (const event of this.events[name]) {
                event.callback(info);
                if (event.once) {
                    this.off(name, event.callback);
                }
            }
        }
    }

    type(name: DPlayerType.Events): 'player' | 'video' | null {
        if ((this.playerEvents as DPlayerType.Events[]).indexOf(name) !== -1) {
            return 'player';
        } else if ((this.videoEvents as DPlayerType.Events[]).indexOf(name) !== -1) {
            return 'video';
        }

        console.error(`Unknown event name: ${name}`);
        return null;
    }
}

export default Events;
