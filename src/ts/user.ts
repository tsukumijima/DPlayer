import DPlayer from './player';
import utils from './utils';

class User {
    storageName: {[key: string]: string};
    default: {[key: string]: number};
    data: {[key: string]: number};

    constructor(player: DPlayer) {
        this.storageName = {
            opacity: 'dplayer-danmaku-opacity',
            volume: 'dplayer-volume',
            unlimited: 'dplayer-danmaku-unlimited',
            danmaku: 'dplayer-danmaku-show',
            subtitle: 'dplayer-subtitle-show',
        };
        this.default = {
            opacity: 1.0,
            volume: Object.prototype.hasOwnProperty.call(player.options, 'volume') ? player.options.volume : 1.0,
            unlimited: (player.options.danmaku && player.options.danmaku.unlimited ? 1 : 0) || 0,
            danmaku: 1,
            subtitle: 1,
        };
        this.data = {};

        this.init();
    }

    init(): void {
        for (const item in this.storageName) {
            const name = this.storageName[item];
            this.data[item] = parseFloat(utils.storage.get(name)! || this.default[item].toString());
        }
    }

    get(key: 'opacity' | 'volume' | 'unlimited' | 'danmaku' | 'subtitle'): number {
        return this.data[key];
    }

    set(key: 'opacity' | 'volume' | 'unlimited' | 'danmaku' | 'subtitle', value: number): void {
        this.data[key] = value;
        utils.storage.set(this.storageName[key], value);
    }
}

export default User;
