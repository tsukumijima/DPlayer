class Subtitle {
    container: any;
    events: any;
    options: any;
    plugins: any;
    video: any;
    constructor(container: any, video: any, plugins: any, options: any, events: any) {
        this.container = container;
        this.video = video;
        this.plugins = plugins;
        this.options = options;
        this.events = events;

        this.init();
    }

    init() {
        this.container.style.fontSize = this.options.fontSize;
        this.container.style.bottom = this.options.bottom;
        this.container.style.color = this.options.color;

        if (this.options.type === 'webvtt' && this.video.textTracks && this.video.textTracks[0]) {
            const track = this.video.textTracks[0];

            track.oncuechange = () => {
                const cue = track.activeCues[0];
                this.container.innerHTML = '';
                if (cue) {
                    const template = document.createElement('div');
                    template.appendChild(cue.getCueAsHTML());
                    const trackHtml = template.innerHTML
                        .split(/\r?\n/)
                        .map((item) => `<p>${item}</p>`)
                        .join('');
                    this.container.innerHTML = trackHtml;
                }
                this.events.trigger('subtitle_change');
            };
        }
    }

    show() {
        this.container.classList.remove('dplayer-subtitle-hide');
        // for aribb24.js
        if (this.options.type === 'aribb24' && this.plugins.aribb24Caption) {
            this.plugins.aribb24Caption.show();
        }
        if (this.options.type === 'aribb24' && this.plugins.aribb24Superimpose) {
            this.plugins.aribb24Superimpose.show();
        }
        this.events.trigger('subtitle_show');
    }

    hide() {
        this.container.classList.add('dplayer-subtitle-hide');
        // for aribb24.js
        if (this.options.type === 'aribb24' && this.plugins.aribb24Caption) {
            this.plugins.aribb24Caption.hide();
        }
        if (this.options.type === 'aribb24' && this.plugins.aribb24Superimpose) {
            this.plugins.aribb24Superimpose.hide();
        }
        this.events.trigger('subtitle_hide');
    }

    toggle() {
        if (this.container.classList.contains('dplayer-subtitle-hide')) {
            this.show();
        } else {
            this.hide();
        }
    }
}

export default Subtitle;
