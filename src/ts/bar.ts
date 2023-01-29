import Template from './template';

class Bar {
    elements: { [key: string]: HTMLElement; };

    constructor(template: Template) {
        this.elements = {};
        this.elements.volume = template.volumeBar;
        this.elements.played = template.playedBar;
        this.elements.loaded = template.loadedBar;
        this.elements.danmaku = template.danmakuOpacityBar;
    }

    /**
     * Update progress
     *
     * @param {String} type - Point out which bar it is
     * @param {Number} percentage
     * @param {String} direction - Point out the direction of this bar, Should be height or width
     */
    set(type: 'volume' | 'played' | 'loaded' | 'danmaku', percentage: number, direction: 'width' | 'height'): void {
        percentage = Math.max(percentage, 0);
        percentage = Math.min(percentage, 1);
        this.elements[type].style[direction] = percentage * 100 + '%';
    }

    get(type: 'volume' | 'played' | 'loaded' | 'danmaku'): number {
        return parseFloat(this.elements[type].style.width) / 100;
    }
}

export default Bar;
