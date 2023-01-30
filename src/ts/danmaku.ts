import DPlayer from './player';
import Events from './events';
import utils from './utils';
import DPlayerType from '../types/DPlayer';

interface DanmakuOptions {
    player: DPlayer,
    container: HTMLElement,
    opacity: number,
    callback: () => void,
    error: (msg: string) => void,
    apiBackend: DPlayerType.APIBackend,
    borderColor: string,
    fontSize: number,
    time: () => number,
    unlimited: number,
    speedRate: number,
    api: DanmakuOptionsAPI,
    events: Events,
    tran: (msg: string) => string,
}

interface DanmakuOptionsAPI {
    id?: string,
    address?: string,
    token?: string,
    maximum?: number,
    addition?: string[],
    user?: string,
}

class Danmaku {
    options: DanmakuOptions;
    player: DPlayer;
    container: HTMLElement;
    danTunnel: {
        right: { [key: string]: HTMLElement[] },
        top: { [key: string]: HTMLElement[] },
        bottom: { [key: string]: HTMLElement[] },
    };
    danIndex: number;
    danFontSize: number;
    dan: DPlayerType.Dan[];
    _opacity: number;
    events: Events;
    unlimited: boolean;

    context: CanvasRenderingContext2D | null = null;
    showing: boolean;
    paused = false;

    constructor(options: DanmakuOptions) {
        this.options = options;
        this.player = this.options.player;
        this.container = this.options.container;
        this.danTunnel = {
            right: {},
            top: {},
            bottom: {},
        };
        this.danIndex = 0;
        this.danFontSize = 24; // 24px
        this.dan = [];
        this.showing = true;
        this._opacity = this.options.opacity;
        this.events = this.options.events;
        this.unlimited = this.options.unlimited === 1;
        this._measure('', 0);

        this.load();
    }

    load(): void {
        let apiurl;
        if (this.options.api.maximum) {
            apiurl = `${this.options.api.address}?id=${this.options.api.id}&max=${this.options.api.maximum}`;
        } else {
            apiurl = `${this.options.api.address}?id=${this.options.api.id}`;
        }
        const endpoints = (this.options.api.addition || []).slice(0);
        endpoints.push(apiurl);
        this.events && this.events.trigger('danmaku_load_start', endpoints);

        this._readAllEndpoints(endpoints, (results) => {
            this.dan = ([] as DPlayerType.Dan[]).concat(...results).sort((a, b) => a.time - b.time);
            window.requestAnimationFrame(() => {
                this.frame();
            });

            this.options.callback();

            this.events && this.events.trigger('danmaku_load_end');
        });
    }

    reload(newAPI: DanmakuOptionsAPI) {
        this.options.api = newAPI;
        this.dan = [];
        this.clear();
        this.load();
    }

    /**
     * Asynchronously read danmaku from all API endpoints
     */
    _readAllEndpoints(endpoints: string[], callback: (results: DPlayerType.Dan[][]) => void): void {
        const results: DPlayerType.Dan[][] = [];
        let readCount = 0;

        for (let i = 0; i < endpoints.length; ++i) {
            this.options.apiBackend.read({
                url: endpoints[i],
                success: (data) => {
                    results[i] = data;

                    ++readCount;
                    if (readCount === endpoints.length) {
                        callback(results);
                    }
                },
                error: (message) => {
                    this.options.error(message || this.options.tran('Danmaku load failed'));
                    results[i] = [];

                    ++readCount;
                    if (readCount === endpoints.length) {
                        callback(results);
                    }
                },
            });
        }
    }

    send(dan: DPlayerType.DanmakuItem, callback: () => void, isCallbackOnError = false): void {
        const danmakuData: DPlayerType.Dan = {
            token: this.options.api.token,
            id: this.options.api.id,
            author: this.options.api.user,
            time: this.options.time(),
            text: dan.text,
            color: dan.color,
            type: dan.type,
            size: dan.size,
        };

        this.options.apiBackend.send({
            url: this.options.api.address,
            data: danmakuData,
            success: () => {
                this.dan.splice(this.danIndex, 0, danmakuData);
                this.danIndex++;
                this.draw({
                    text: this.htmlEncode(danmakuData.text),
                    color: danmakuData.color,
                    type: danmakuData.type,
                    size: danmakuData.size,
                    border: true,
                });

                this.events && this.events.trigger('danmaku_send', danmakuData);
                callback();
            },
            error: (message) => {
                this.options.error(message || this.options.tran('Danmaku send failed'));
                if (isCallbackOnError === true) {
                    callback();
                }
            },
        });
    }

    frame(): void {
        if (this.dan.length && !this.paused && this.showing) {
            let item = this.dan[this.danIndex];
            const dan = [];
            // @ts-ignore
            while (item && this.options.time() > parseFloat(item.time)) {
                dan.push(item);
                item = this.dan[++this.danIndex];
            }
            this.draw(dan);
        }
        window.requestAnimationFrame(() => {
            this.frame();
        });
    }

    opacity(percentage?: number): number {
        if (percentage !== undefined) {
            this.container.style.setProperty('--dplayer-danmaku-opacity', `${percentage}`);
            this._opacity = percentage;

            this.events && this.events.trigger('danmaku_opacity', this._opacity);
        }
        return this._opacity;
    }

    /**
     * Push a danmaku into DPlayer
     *
     * @param {Object Array} dan - {text, color, type}
     * text - danmaku content
     * color - danmaku color, default: `#ffeaea`
     * type - danmaku type, `right` `top` `bottom`, default: `right`
     * size - danmaku size, `medium` `big` `small`, default: `medium`
     */
    draw(dan: DPlayerType.DanmakuItem | DPlayerType.DanmakuItem[] | DPlayerType.Dan[]): DocumentFragment | null {
        if (this.showing) {

            // if the dan variable is an object, create and assign an array of only one object
            if (Object.prototype.toString.call(dan) !== '[object Array]') {
                // @ts-ignore
                dan = [dan];
            }
            dan = dan as DPlayerType.DanmakuItem[] | DPlayerType.Dan[];

            // adjust the font size according to the screen size
            const ratioRate = 1.25; // magic!
            let ratio = this.container.offsetWidth / 1024 * ratioRate;
            if (ratio >= 1) ratio = 1; // ratio should not exceed 1
            let itemFontSize = this.options.fontSize * ratio;
            const itemHeight = itemFontSize + (6 * ratio); // 6 is the vertical margin of danmaku

            const danWidth = this.container.offsetWidth;
            const danHeight = this.container.offsetHeight;
            // @ts-ignore
            const itemY = parseInt(danHeight / itemHeight);

            const danItemRight = (danmakuItem: HTMLElement) => {
                const danmakuItemWidth = danmakuItem.offsetWidth || parseInt(danmakuItem.style.width);
                const danmakuItemRight =
                    danmakuItem.getBoundingClientRect().right || this.container.getBoundingClientRect().right + danmakuItemWidth;
                return this.container.getBoundingClientRect().right - danmakuItemRight;
            };

            const danSpeed = (width: number) => (danWidth + width) / 5;

            const getTunnel = (danmakuItem: HTMLElement, type: DPlayerType.DanmakuType, width: number) => {
                const tmp = danWidth / danSpeed(width);

                for (let i = 0; this.unlimited || i < itemY; i++) {
                    const item = this.danTunnel[type][i + ''];
                    if (item && item.length) {
                        if (type !== 'right') {
                            continue;
                        }
                        for (let j = 0; j < item.length; j++) {
                            const danRight = danItemRight(item[j]) - 10;
                            if (danRight <= danWidth - tmp * danSpeed(parseInt(item[j].style.width)) || danRight <= 0) {
                                break;
                            }
                            if (j === item.length - 1) {
                                this.danTunnel[type][i + ''].push(danmakuItem);
                                danmakuItem.addEventListener('animationend', () => {
                                    this.danTunnel[type][i + ''].splice(0, 1);
                                });
                                return i % itemY;
                            }
                        }
                    } else {
                        this.danTunnel[type][i + ''] = [danmakuItem];
                        danmakuItem.addEventListener('animationend', () => {
                            this.danTunnel[type][i + ''].splice(0, 1);
                        });
                        return i % itemY;
                    }
                }
                return -1;
            };

            const docFragment = document.createDocumentFragment();

            for (let i = 0; i < dan.length; i++) {

                // Whether the type is numeric (for compatibility)
                // @ts-ignore
                if (isFinite(dan[i].color)) {
                    // @ts-ignore
                    dan[i].color = utils.number2Color(dan[i].color);
                }
                // @ts-ignore
                if (isFinite(dan[i].type)) {
                    // @ts-ignore
                    dan[i].type = utils.number2Type(dan[i].type);
                }

                // set default danmaku color
                if (!dan[i].color) {
                    dan[i].color = '#ffeaea'; // white
                }

                // set default danmaku type
                if (!dan[i].type || (dan[i].type !== 'right' && dan[i].type !== 'top' && dan[i].type !== 'bottom')) {
                    dan[i].type = 'right';
                }

                // set default danmaku size
                if (!dan[i].size) {
                    dan[i].size = 'medium';
                }

                // set danmaku size
                // used to calculate danmaku width
                // danmaku size doesn't affect itemHeight
                switch (dan[i].size) {
                    case 'big':
                        itemFontSize = itemFontSize * 1.25;
                        break;
                    case 'small':
                        itemFontSize = itemFontSize * 0.8;
                        break;
                }

                const itemWidth = (() => {
                    let measure = 0;
                    // returns the width of the widest line
                    for (const line of dan[i].text.split('\n')) {
                        const result = this._measure(line, itemFontSize);
                        if (result > measure) {
                            measure = result;
                        }
                    }
                    return measure;
                })();

                // repeat for each line of danmaku
                // if danmaku type is bottom, the order must be reversed
                const lines = dan[i].text.split('\n');
                for (const line of (dan[i].type === 'bottom') ? lines.reverse() : lines) {

                    const danmakuItem = document.createElement('div');
                    danmakuItem.classList.add('dplayer-danmaku-item');
                    danmakuItem.classList.add(`dplayer-danmaku-${dan[i].type}`); // set danmaku type (CSS)
                    danmakuItem.classList.add(`dplayer-danmaku-size-${dan[i].size}`); // set danmaku size (CSS)

                    // set danmaku color
                    danmakuItem.style.color = dan[i].color;

                    // set danmaku text
                    // @ts-ignore
                    if (dan[i].border) {
                        danmakuItem.innerHTML = `<span style='border: 2px solid ${this.options.borderColor};'>${line}</span>`;
                    } else {
                        danmakuItem.innerHTML = line;
                    }

                    // set event to remove this danmaku
                    danmakuItem.addEventListener('animationend', () => {
                        this.container.removeChild(danmakuItem);
                    });

                    // ensure and adjust danmaku position
                    const tunnel = getTunnel(danmakuItem, dan[i].type, itemWidth);
                    switch (dan[i].type) {
                        case 'right':
                            if (tunnel >= 0) {
                                danmakuItem.style.width = itemWidth + 1 + 'px';
                                danmakuItem.style.top = itemHeight * tunnel + 8 + 'px';
                                danmakuItem.style.transform = `translateX(-${danWidth}px)`;
                                danmakuItem.style.willChange = 'transform';
                            }
                            break;
                        case 'top':
                            if (tunnel >= 0) {
                                danmakuItem.style.width = itemWidth + 1 + 'px';
                                danmakuItem.style.top = itemHeight * tunnel + 8 + 'px';
                                danmakuItem.style.willChange = 'visibility';
                            }
                            break;
                        case 'bottom':
                            if (tunnel >= 0) {
                                danmakuItem.style.width = itemWidth + 1 + 'px';
                                danmakuItem.style.bottom = itemHeight * tunnel + 8 + 'px';
                                danmakuItem.style.willChange = 'visibility';
                            }
                            break;
                        default:
                            console.error(`Can't handled danmaku type: ${dan[i].type}`);
                    }

                    if (tunnel >= 0) {
                        // move
                        danmakuItem.classList.add('dplayer-danmaku-move');
                        danmakuItem.style.animationDuration = this._danAnimation(dan[i].type);

                        // insert
                        docFragment.appendChild(danmakuItem);
                    }
                }
            }

            // set base danmaku font size
            this.container.style.setProperty('--dplayer-danmaku-font-size', `${itemFontSize}px`);

            // draw danmaku
            this.container.appendChild(docFragment);
            return docFragment;
        }

        return null;
    }

    play(): void {
        this.paused = false;
    }

    pause(): void {
        this.paused = true;
    }

    _measure(text: string, itemFontSize: number): number {
        if (!this.context || this.danFontSize !== itemFontSize) {
            this.danFontSize = itemFontSize;
            this.context = document.createElement('canvas').getContext('2d');
            this.context!.font = `bold ${this.danFontSize}px "Segoe UI", Arial`;
        }
        return this.context!.measureText(text).width;
    }

    seek(): void {
        this.clear();
        for (let i = 0; i < this.dan.length; i++) {
            if (this.dan[i].time >= this.options.time()) {
                this.danIndex = i;
                break;
            }
            this.danIndex = this.dan.length;
        }
    }

    clear(): void {
        this.danTunnel = {
            right: {},
            top: {},
            bottom: {},
        };
        this.danIndex = 0;
        this.options.container.innerHTML = '';

        this.events && this.events.trigger('danmaku_clear');
    }

    htmlEncode(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2f;');
    }

    resize(): void {
        const danWidth = this.container.offsetWidth;
        const items = this.container.querySelectorAll<HTMLElement>('.dplayer-danmaku-item');
        for (let i = 0; i < items.length; i++) {
            items[i].style.transform = `translateX(-${danWidth}px)`;
        }
    }

    hide(): void {
        this.showing = false;
        this.pause();
        this.clear();

        this.events && this.events.trigger('danmaku_hide');
    }

    show(): void {
        this.seek();
        this.showing = true;
        this.play();

        this.events && this.events.trigger('danmaku_show');
    }

    toggle(): void {
        if (this.showing) {
            this.hide();
        } else {
            this.show();
        }
    }

    unlimit(boolean: boolean): void {
        this.unlimited = boolean;
    }

    speed(rate: number): void {
        this.options.speedRate = rate;
    }

    _danAnimation(position: DPlayerType.DanmakuType): string {
        const rate = this.options.speedRate;
        const isFullScreen =
            this.player.fullScreen.isFullScreen('browser') ||
            this.player.fullScreen.isFullScreen('web');
        const animations = {
            top: `${(isFullScreen ? 4.5 : 4) / rate}s`,
            right: `${(isFullScreen ? 5.5 : 5) / rate}s`,
            bottom: `${(isFullScreen ? 4.5 : 4) / rate}s`,
        };
        return animations[position];
    }
}

export default Danmaku;