class Subtitle {
    constructor(container, video, aribb24, options, events) {
        this.container = container;
        this.video = video;
        this.aribb24 = aribb24;
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
        this.events.trigger('subtitle_show');
        // for aribb24.js
        if (this.options.type === 'aribb24' && this.aribb24) {
            this.aribb24.show();
        }
    }

    hide() {
        this.container.classList.add('dplayer-subtitle-hide');
        this.events.trigger('subtitle_hide');
        // for aribb24.js
        if (this.options.type === 'aribb24' && this.aribb24) {
            this.aribb24.hide();
        }
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
