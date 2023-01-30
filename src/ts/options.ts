/* global DPLAYER_VERSION */
import defaultApiBackend from './api';
import DPlayer from './player';
import * as DPlayerType from '../types/DPlayer';

export default (options: DPlayerType.Options): DPlayerType.OptionsInternal => {
    // default options
    const defaultOption: DPlayerType.Options = {
        container: options.container || document.querySelector<HTMLElement>('.dplayer') || undefined,
        live: false,
        liveSyncMinBufferSize: 0.8,
        syncWhenPlayingLive: true,
        autoplay: false,
        theme: '#b7daff',
        loop: false,
        lang: navigator.language.toLowerCase(),
        screenshot: false,
        pictureInPicture: true,
        airplay: true,
        hotkey: true,
        preload: 'metadata',
        volume: 1.0,
        playbackSpeed: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2],
        apiBackend: defaultApiBackend,
        video: {},
        contextmenu: [],
        mutex: true,
        pluginOptions: {},
    };
    for (const defaultKey in defaultOption) {
        if (Object.prototype.hasOwnProperty.call(defaultOption, defaultKey) && !Object.prototype.hasOwnProperty.call(options, defaultKey)) {
            // @ts-ignore
            options[defaultKey] = defaultOption[defaultKey];
        }
    }
    if (options.video) {
        !options.video.type && (options.video.type = 'auto');
    }
    if (typeof options.danmaku === 'object' && options.danmaku) {
        !options.danmaku.user && (options.danmaku.user = 'DPlayer');
        !options.danmaku.speedRate && (options.danmaku.speedRate = 1);
        !options.danmaku.fontSize && (options.danmaku.fontSize = 35);
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
            options.video.quality.forEach((quality, qualityIndex) => {
                if (options.video.defaultQuality === quality.name) {
                    options.video.defaultQuality = qualityIndex;
                }
            });
            // failsafe
            if (typeof options.video.defaultQuality === 'string') {
                options.video.defaultQuality = 0;
            }
        }
        // failsafe
        if (options.video.defaultQuality === undefined) {
            options.video.defaultQuality = 0;
        }
        options.video.type = options.video.quality[options.video.defaultQuality].type;
        options.video.url = options.video.quality[options.video.defaultQuality].url;
    }

    if (options.lang) {
        options.lang = options.lang.toLowerCase();
    }

    options.contextmenu = options.contextmenu!.concat([
        {
            text: 'Video info',
            click: (player: DPlayer) => {
                player.infoPanel.toggle();
            },
        },
        {
            // @ts-ignore
            text: `DPlayer v${DPLAYER_VERSION}`,
            link: 'https://github.com/tsukumijima/DPlayer',
        },
    ]);

    const optionsInternal: DPlayerType.OptionsInternal = {
        container: options.container!,
        live: options.live!,
        liveSyncMinBufferSize: options.liveSyncMinBufferSize!,
        syncWhenPlayingLive: options.syncWhenPlayingLive!,
        autoplay: options.autoplay!,
        theme: options.theme!,
        loop: options.loop!,
        lang: options.lang!,
        screenshot: options.screenshot!,
        pictureInPicture: options.pictureInPicture!,
        airplay: options.airplay!,
        hotkey: options.hotkey!,
        preload: options.preload!,
        volume: options.volume!,
        playbackSpeed: options.playbackSpeed!,
        logo: options.logo,  // optional
        apiBackend: options.apiBackend!,
        video: options.video as DPlayerType.VideoInternal,
        subtitle: options.subtitle as DPlayerType.SubtitleInternal,  // optional
        danmaku: options.danmaku as DPlayerType.DanmakuInternal,  // optional
        contextmenu: options.contextmenu!,
        highlight: options.highlight,  // optional
        mutex: options.mutex!,
        pluginOptions: options.pluginOptions!,
    };

    return optionsInternal;
};
