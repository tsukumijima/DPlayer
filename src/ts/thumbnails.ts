import Events from './events';
import DPlayer from './player';

class Thumbnails {
    player: DPlayer;
    container: HTMLElement;
    barWidth: number;
    events: Events;
    private readonly viewportWidth = 180;
    private readonly viewportHeight = 101;
    private readonly thumbnailSpace = 26;
    private width: number;
    private height: number;
    private interval?: number;
    private totalCount: number;
    private columnCount: number;
    private magnificationScale: number;

    constructor(options: {
        player: DPlayer;
        url: string;
        events: Events;
        interval?: number;
        totalCount?: number;
        width?: number;
        height?: number;
        columnCount?: number;
    }) {
        this.player = options.player;
        this.container = this.player.template.barPreview;
        this.barWidth = this.player.template.barWrap.offsetWidth;
        this.events = options.events;
        this.interval = options.interval;

        // Calculate total count based on interval or use specified totalCount
        if (options.interval) {
            this.totalCount = Math.ceil(this.player.video.duration / options.interval);
        } else {
            this.totalCount = options.totalCount || 100;
        }

        // Set dimensions
        this.width = options.width || 160;
        // 16:9 aspect ratio if height is not specified
        this.height = options.height || Math.floor(this.width * 9 / 16);
        this.columnCount = options.columnCount || 100;  // Default to 100 columns if not specified

        // Calculate the magnification factor to make the thumbnail width VIEWPORT_WIDTH
        this.magnificationScale = this.viewportWidth / this.width;

        // Set initial styles
        this.player.template.barWrap.style.setProperty('--thumbnail-url', `url(${options.url})`);  // preload thumbnails
        this.container.style.width = `${this.viewportWidth}px`;
        this.container.style.height = `${this.viewportHeight}px`;
        this.container.style.top = `${-this.viewportHeight - this.thumbnailSpace}px`;
        this.container.style.backgroundPosition = '0 0';

        // Resize thumbnails when video duration changes
        this.player.on('durationchange', () => {
            this.resize(
                this.width,
                this.height,
                this.barWidth,
            );
        });
    }

    resize(width: number, height: number, barWrapWidth: number): void {
        // Update internal dimensions
        this.width = width;
        this.height = height;
        this.barWidth = barWrapWidth;

        // Recalculate the total count based on the new video duration
        if (this.interval) {
            this.totalCount = Math.ceil(this.player.video.duration / this.interval);
        }

        // Calculate the number of rows
        const rowCount = Math.ceil(this.totalCount / this.columnCount);

        // Calculate background-size based on the sprite image dimensions
        const backgroundWidth = this.columnCount * width * this.magnificationScale;
        const backgroundHeight = rowCount * height * this.magnificationScale;

        // Update container styles
        this.container.style.width = `${this.viewportWidth}px`;
        this.container.style.height = `${this.viewportHeight}px`;
        this.container.style.top = `${-this.viewportHeight - this.thumbnailSpace}px`;
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
        this.container.style.backgroundPosition = `-${backgroundX * this.magnificationScale}px -${backgroundY * this.magnificationScale}px`;

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
