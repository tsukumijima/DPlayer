import Template from './template';
declare class Bar {
    elements: {
        [key: string]: HTMLElement;
    };
    constructor(template: Template);
    /**
     * Update progress
     *
     * @param {String} type - Point out which bar it is
     * @param {Number} percentage
     * @param {String} direction - Point out the direction of this bar, Should be height or width
     */
    set(type: 'volume' | 'played' | 'loaded' | 'danmaku', percentage: number, direction: 'width' | 'height'): void;
    get(type: 'volume' | 'played' | 'loaded' | 'danmaku'): number;
}
export default Bar;
//# sourceMappingURL=bar.d.ts.map