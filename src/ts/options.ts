/* global DPLAYER_VERSION */
import defaultApiBackend from './api';

export default (options: any) => {
    // default options
    const defaultOption = {
        container: options.element || document.getElementsByClassName('dplayer')[0],
        live: false,
        liveSyncMinBufferSize: 0.8,
        syncWhenPlayingLive: true,
        autoplay: false,
        theme: '#b7daff',
        loop: false,
        // @ts-expect-error TS(2339): Property 'browserLanguage' does not exist on type ... Remove this comment to see the full error message
        lang: (navigator.language || navigator.browserLanguage).toLowerCase(),
        screenshot: false,
        airplay: true,
        hotkey: true,
        preload: 'metadata',
        volume: 1.0,
        playbackSpeed: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        apiBackend: defaultApiBackend,
        video: {},
        contextmenu: [],
        mutex: true,
        pictureInPicture: true,
        pluginOptions: { hls: {}, mpegts: {}, flv: {}, dash: {}, webtorrent: {}, aribb24: {} },
    };
    for (const defaultKey in defaultOption) {
        if (Object.prototype.hasOwnProperty.call(defaultOption, defaultKey) && !Object.prototype.hasOwnProperty.call(options, defaultKey)) {
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            options[defaultKey] = defaultOption[defaultKey];
        }
    }
    if (options.video) {
        !options.video.type && (options.video.type = 'auto');
    }
    if (typeof options.danmaku === 'object' && options.danmaku) {
        !options.danmaku.user && (options.danmaku.user = 'DPlayer');
    }
    if (options.subtitle) {
        !options.subtitle.type && (options.subtitle.type = 'webvtt');
        !options.subtitle.fontSize && (options.subtitle.fontSize = '20px');
        !options.subtitle.bottom && (options.subtitle.bottom = '40px');
        !options.subtitle.color && (options.subtitle.color = '#fff');
    }

    if (options.video.quality) {
        // defaultQuality can be specified as a string
        if (typeof options.video.defaultQuality === 'string') {
            options.video.quality.forEach((quality: any, qualityIndex: any) => {
                if (options.video.defaultQuality === quality.name) {
                    options.video.defaultQuality = qualityIndex;
                }
            });
            // failsafe
            if (typeof options.video.defaultQuality === 'string') {
                options.video.defaultQuality = 0;
            }
        }
        options.video.type = options.video.quality[options.video.defaultQuality].type;
        options.video.url = options.video.quality[options.video.defaultQuality].url;
    }

    if (options.lang) {
        options.lang = options.lang.toLowerCase();
    }

    options.contextmenu = options.contextmenu.concat([
        {
            text: 'Video info',
            click: (player: any) => {
                player.infoPanel.toggle();
            },
        },
        {
            // @ts-expect-error TS(2304): Cannot find name 'DPLAYER_VERSION'.
            text: `DPlayer v${DPLAYER_VERSION}`,
            link: 'https://github.com/tsukumijima/DPlayer',
        },
    ]);

    return options;
};
