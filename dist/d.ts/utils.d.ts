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
     * Get the X coordinate of the pointer relative to a container element.
     * @param event - PointerEvent or TouchEvent.
     * @param container - The container to calculate relative coordinate for.
     * @returns The relative X coordinate in pixels.
     */
    getRelativeX: (event: PointerEvent | TouchEvent | MouseEvent, container: HTMLElement) => number;
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
    isWebKit: boolean;
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