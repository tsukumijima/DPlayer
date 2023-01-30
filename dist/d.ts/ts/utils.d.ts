import Template from './template';
declare const utils: {
    /**
     * Parse second to time string
     *
     * @param {Number} second
     * @return {String} 00:00 or 00:00:00
     */
    secondToTime: (second: number) => string;
    /**
     * get video duration
     * compatibility: measures against video length becoming Infinity during HLS playback on native HLS player of Safari
     *
     * @param {HTMLVideoElement} video
     * @param {Template} template
     * @returns {Number}
     */
    getVideoDuration: (video: HTMLVideoElement, template: Template) => number;
    /**
     * control play progress
     * get element's view position
     *
     * @param {HTMLElement} element
     * @returns {Number}
     */
    getElementViewLeft: (element: HTMLElement) => number;
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
    getBoundingClientRectViewLeft(element: HTMLElement): number;
    getScrollPosition(): {
        left: number;
        top: number;
    };
    setScrollPosition({ left, top }: {
        left: number;
        top: number;
    }): void;
    isMobile: boolean;
    isFirefox: boolean;
    isChrome: boolean;
    storage: {
        set: (key: string, value: any) => void;
        get: (key: string) => string | null;
    };
    nameMap: {
        dragStart: string;
        dragMove: string;
        dragEnd: string;
    };
    color2Number: (color: string) => number;
    number2Color: (number: number) => string;
    number2Type: (number: number) => string;
};
export default utils;
//# sourceMappingURL=utils.d.ts.map