import Events from './events';

class Thumbnails {
    container: HTMLElement;
    barWidth: number;
    events: Events;
    private width: number;
    private height: number;
    private totalCount: number;
    private columnCount: number;

    constructor(options: {
        container: HTMLElement;
        barWidth: number;
        url: string;
        events: Events;
        duration?: number;
        interval?: number;
        totalCount?: number;
        width?: number;
        height?: number;
        columnCount?: number;
    }) {
        this.container = options.container;
        this.barWidth = options.barWidth;
        this.events = options.events;

        // Calculate total count based on interval or use specified totalCount
        if (options.interval && options.duration) {
            this.totalCount = Math.ceil(options.duration / options.interval);
        } else {
            this.totalCount = options.totalCount || 100;
        }

        // Set dimensions
        this.width = options.width || 160;
        // 16:9 aspect ratio if height is not specified
        this.height = options.height || Math.floor(this.width * 9 / 16);
        this.columnCount = options.columnCount || 100;  // Default to 100 columns if not specified

        // Set initial styles
        this.container.style.backgroundImage = `url('${options.url}')`;
        this.container.style.width = `${this.width}px`;
        this.container.style.height = `${this.height}px`;
        this.container.style.top = `${-this.height + 2}px`;
        this.container.style.backgroundPosition = '0 0';
    }

    resize(width: number, height: number, barWrapWidth: number): void {
        // Update internal dimensions
        this.width = width;
        this.height = height;
        this.barWidth = barWrapWidth;

        // Calculate the number of rows
        const rowCount = Math.ceil(this.totalCount / this.columnCount);

        // Calculate background-size based on the sprite image dimensions
        const backgroundWidth = this.columnCount * width;
        const backgroundHeight = rowCount * height;

        // Update container styles
        this.container.style.width = `${width}px`;
        this.container.style.height = `${height}px`;
        this.container.style.top = `${-height + 2}px`;
        this.container.style.backgroundSize = `${backgroundWidth}px ${backgroundHeight}px`;
    }

    show(): void {
        this.container.style.display = 'block';
        this.events && this.events.trigger('thumbnails_show');
    }

    move(position: number): void {
        // Calculate the current thumbnail index based on position
        const index = Math.max(0, Math.min(Math.floor((position / this.barWidth) * this.totalCount), this.totalCount - 1));

        // Calculate row and column based on index
        const column = index % this.columnCount;
        const row = Math.floor(index / this.columnCount);

        // Calculate background-position based on row and column
        const backgroundX = column * this.width;
        const backgroundY = row * this.height;

        // Set the background position
        this.container.style.backgroundPosition = `-${backgroundX}px -${backgroundY}px`;

        // Position the container
        const left = Math.min(Math.max(position - this.container.offsetWidth / 2, -10), this.barWidth - 150);
        this.container.style.left = `${left}px`;
    }

    hide(): void {
        this.container.style.display = 'none';
        this.events && this.events.trigger('thumbnails_hide');
    }
}

export default Thumbnails;
