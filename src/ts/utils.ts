import Template from './template';

const isMobile = /iPhone|iPad|iPod|Windows|Macintosh|Android|Mobile/i.test(navigator.userAgent) && 'ontouchend' in document;

const utils = {
    /**
     * Parse second to time string
     *
     * @param {Number} second
     * @return {String} 00:00 or 00:00:00
     */
    secondToTime: (second: number): string => {
        second = second || 0;
        if (second === 0 || second === Infinity || second.toString() === 'NaN') {
            return '00:00';
        }
        const add0 = (num: number): string => num < 10 ? '0' + num : '' + num;
        const hour = Math.floor(second / 3600);
        const min = Math.floor((second - hour * 3600) / 60);
        const sec = Math.floor(second - hour * 3600 - min * 60);
        return (hour > 0 ? [hour, min, sec] : [min, sec]).map(add0).join(':');
    },

    /**
     * get video duration
     * compatibility: measures against video length becoming Infinity during HLS playback on native HLS player of Safari
     *
     * @param {HTMLVideoElement} video
     * @param {Template} template
     * @returns {Number}
     */
    getVideoDuration: (video: HTMLVideoElement, template: Template): number => {
        let duration = video.duration;
        if (duration === Infinity) {
            if (video.seekable.length > 0) {
                template.dtime.textContent = utils.secondToTime(video.seekable.end(0));
                duration = video.seekable.end(0);
            } else if (video.buffered.length > 0) {
                template.dtime.textContent = utils.secondToTime(video.buffered.end(0));
                duration = video.buffered.end(0);
            }
        }
        return duration;
    },

    /**
     * control play progress
     * get element's view position
     *
     * @param {HTMLElement} element
     * @returns {Number}
     */
    getElementViewLeft: (element: HTMLElement): number => {
        let actualLeft = element.offsetLeft;
        let current = element.offsetParent as HTMLElement | null;
        const elementScrollLeft = document.body.scrollLeft + document.documentElement.scrollLeft;
        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            while (current !== null) {
                actualLeft += current.offsetLeft;
                current = current.offsetParent as HTMLElement | null;
            }
        } else {
            while (current !== null && current !== element) {
                actualLeft += current.offsetLeft;
                current = current.offsetParent as HTMLElement | null;
            }
        }
        return actualLeft - elementScrollLeft;
    },

    /**
     * optimize control play progress
     * optimize get element's view position, for float dialog video player
     * The value returned by getBoundingClientRect in IE8 and below is missing width and height values
     * The value returned by getBoundingClientRect in Firefox 11 and below will also include the value of transform
     * The value returned by getBoundingClientRect in Opera 10.5 and below is missing width and height values
     *
     * @param {HTMLElement} element
     * @returns {Number}
     */
    getBoundingClientRectViewLeft(element: HTMLElement): number {
        const scrollTop = window.scrollY || window.pageYOffset || document.body.scrollTop + ((document.documentElement && document.documentElement.scrollTop) || 0);

        if (element.getBoundingClientRect) {
            // @ts-expect-error TS(2339): Property 'offset' does not exist on type '(element... Remove this comment to see the full error message
            if (typeof this.getBoundingClientRectViewLeft.offset !== 'number') {
                let temp = document.createElement('div');
                temp.style.cssText = 'position:absolute;top:0;left:0;';
                document.body.appendChild(temp);
                // @ts-expect-error TS(2339): Property 'offset' does not exist on type '(element... Remove this comment to see the full error message
                this.getBoundingClientRectViewLeft.offset = -temp.getBoundingClientRect().top - scrollTop;
                document.body.removeChild(temp);
                // @ts-expect-error TS(2322): Type 'null' is not assignable to type 'HTMLDivElem... Remove this comment to see the full error message
                temp = null;
            }
            const rect = element.getBoundingClientRect();
            // @ts-expect-error TS(7022): 'offset' implicitly has type 'any' because it does... Remove this comment to see the full error message
            const offset = this.getBoundingClientRectViewLeft.offset;

            return rect.left + offset;
        } else {
            // not support getBoundingClientRect
            return this.getElementViewLeft(element);
        }
    },

    getScrollPosition(): { left: number; top: number } {
        return {
            left: window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0,
            top: window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0,
        };
    },

    setScrollPosition({ left = 0, top = 0 }: { left: number; top: number; }): void {
        if (this.isFirefox) {
            document.documentElement.scrollLeft = left;
            document.documentElement.scrollTop = top;
        } else {
            window.scrollTo(left, top);
        }
    },

    isMobile: isMobile,

    isFirefox: /firefox/i.test(window.navigator.userAgent),

    isChrome: /chrome/i.test(window.navigator.userAgent),

    storage: {
        set: (key: string, value: any): void => {
            localStorage.setItem(key, value);
        },

        get: (key: string): string | null => localStorage.getItem(key),
    },

    nameMap: {
        dragStart: isMobile ? 'touchstart' : 'mousedown',
        dragMove: isMobile ? 'touchmove' : 'mousemove',
        dragEnd: isMobile ? 'touchend' : 'mouseup',
    },

    // currently not used
    color2Number: (color: string): number => {
        if (color[0] === '#') {
            color = color.substr(1);
        }
        if (color.length === 3) {
            color = `${color[0]}${color[0]}${color[1]}${color[1]}${color[2]}${color[2]}`;
        }
        return (parseInt(color, 16) + 0x000000) & 0xffffff;
    },

    number2Color: (number: number): string => '#' + ('00000' + number.toString(16)).slice(-6),

    number2Type: (number: number): string => {
        switch (number) {
            case 0:
                return 'right';
            case 1:
                return 'top';
            case 2:
                return 'bottom';
            default:
                return 'right';
        }
    },
};

export default utils;
