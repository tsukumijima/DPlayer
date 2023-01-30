// @ts-ignore
import Promise from 'promise-polyfill';
import axios from 'axios';
import * as aribb24js from 'aribb24.js';
import Mpegts from 'mpegts.js';

import utils from './utils';
import handleOption from './options';
import i18n from './i18n';
import Template from './template';
import Icons from './icons';
import Danmaku from './danmaku';
import Events from './events';
import FullScreen from './fullscreen';
import User from './user';
import Subtitle from './subtitle';
import Bar from './bar';
import Timer from './timer';
import Bezel from './bezel';
import Controller from './controller';
import Setting from './setting';
import Comment from './comment';
import HotKey from './hotkey';
import ContextMenu from './contextmenu';
import InfoPanel from './info-panel';
import tplVideo from '../template/video.art';
import DPlayerType from '../types/DPlayer';

let index = 0;
const instances: DPlayer[] = [];

declare let window: DPlayerType.WindowExtend;

class DPlayer {
    bar: Bar;
    bezel: Bezel;
    comment: Comment | null = null;
    contextmenu: ContextMenu;
    controller: Controller;
    danmaku: Danmaku | null = null;
    events: Events;
    fullScreen: FullScreen;
    hotkey: HotKey;
    infoPanel: InfoPanel;
    setting: Setting;
    subtitle: Subtitle | null = null;
    template: Template;
    timer: Timer;
    user: User;

    container: HTMLElement;
    containerClickFun: () => void;
    docClickFun: () => void;
    focus = false;
    narrow = false;
    noticeTime: number | null = null;
    options: DPlayerType.OptionsInternal;
    paused = false;
    plugins: DPlayerType.Plugins;
    prevVideo: HTMLVideoElement | null = null;
    quality: DPlayerType.VideoQualityInternal | null = null;
    qualityIndex: number | null = null;
    switchingQuality = false;
    resizeObserver: ResizeObserver;
    tran: (text: string) => string;
    type: DPlayerType.VideoType | string = 'auto';
    video: HTMLVideoElement;

    /**
     * DPlayer constructor function
     *
     * @param {Object} options - See README
     * @constructor
     */
    constructor(options: DPlayerType.Options) {
        this.options = handleOption({ preload: options.video.type === 'webtorrent' ? 'none' : 'metadata', ...options });

        if (this.options.video.quality) {
            this.qualityIndex = this.options.video.defaultQuality!;
            this.quality = this.options.video.quality[this.options.video.defaultQuality!];
        }
        // @ts-expect-error TS(7009): 'new' expression, whose target lacks a construct s... Remove this comment to see the full error message
        this.tran = new i18n(this.options.lang).tran;
        this.events = new Events();
        this.user = new User(this);
        this.container = this.options.container;

        this.container.classList.add('dplayer');
        if (!this.options.danmaku) {
            this.container.classList.add('dplayer-no-danmaku');
        }
        if (this.options.live) {
            this.container.classList.add('dplayer-live');
        } else {
            this.container.classList.remove('dplayer-live');
        }
        if (utils.isMobile) {
            this.container.classList.add('dplayer-mobile');
        }
        this.narrow = this.container.offsetWidth <= 500;
        if (this.narrow) {
            this.container.classList.add('dplayer-narrow');
        }

        // observe container resize
        this.resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.target === this.container) {
                    this.narrow = this.container.offsetWidth <= 500;
                    if (this.narrow) {
                        this.container.classList.add('dplayer-narrow');
                    } else {
                        this.container.classList.remove('dplayer-narrow');
                    }
                }
            }
        });
        this.resizeObserver.observe(this.container);

        this.template = new Template({
            container: this.container,
            options: this.options,
            index: index,
            tran: this.tran,
        });

        this.video = this.template.video;

        this.bar = new Bar(this.template);

        this.bezel = new Bezel(this.template.bezel);

        this.fullScreen = new FullScreen(this);

        this.controller = new Controller(this);

        if (this.options.danmaku) {
            this.danmaku = new Danmaku({
                player: this,
                container: this.template.danmaku,
                opacity: this.user.get('opacity'),
                callback: () => {
                    setTimeout(() => {
                        this.template.danmakuLoading.style.display = 'none';

                        // autoplay
                        if (this.options.autoplay) {
                            this.play();
                        }
                    }, 0);
                },
                error: (msg: string) => {
                    this.notice(msg);
                },
                apiBackend: this.options.apiBackend,
                borderColor: this.options.theme,
                fontSize: this.options.danmaku.fontSize,
                time: () => this.video.currentTime,
                unlimited: this.user.get('unlimited'),
                speedRate: this.options.danmaku.speedRate,
                api: {
                    id: this.options.danmaku.id,
                    address: this.options.danmaku.api,
                    token: this.options.danmaku.token,
                    maximum: this.options.danmaku.maximum,
                    addition: this.options.danmaku.addition,
                    user: this.options.danmaku.user,
                },
                events: this.events,
                tran: (msg: string) => this.tran(msg),
            });

            this.comment = new Comment(this);
        }

        this.plugins = {};
        this.docClickFun = () => {
            this.focus = false;
        };
        this.containerClickFun = () => {
            this.focus = true;
        };
        document.addEventListener('click', this.docClickFun, true);
        this.container.addEventListener('click', this.containerClickFun, true);

        this.paused = true;

        this.timer = new Timer(this);

        this.hotkey = new HotKey(this);

        this.contextmenu = new ContextMenu(this);

        this.initVideo(this.video, (this.quality && this.quality.type) || this.options.video.type);

        this.setting = new Setting(this);

        this.infoPanel = new InfoPanel(this);

        if (!this.danmaku && this.options.autoplay) {
            this.play();
        }

        index++;
        instances.push(this);
    }

    /**
     * Seek video
     */
    seek(time: number): void {
        time = Math.max(time, 0);
        const duration = utils.getVideoDuration(this.video, this.template);
        if (duration) {
            time = Math.min(time, duration);
        }
        if (this.video.currentTime < time) {
            this.notice(`${this.tran('FF')} ${(time - this.video.currentTime).toFixed(0)} ${this.tran('s')}`);
        } else if (this.video.currentTime > time) {
            this.notice(`${this.tran('REW')} ${(this.video.currentTime - time).toFixed(0)} ${this.tran('s')}`);
        }

        this.video.currentTime = time;

        if (this.danmaku) {
            this.danmaku.seek();
        }

        this.bar.set('played', time / duration, 'width');
        this.template.ptime.innerHTML = utils.secondToTime(time);
    }

    /**
     * Sync video (live only)
     */
    sync(quiet = false): void {
        if (this.options.live) {
            const time = utils.getVideoDuration(this.video, this.template) - this.options.liveSyncMinBufferSize;
            try {
                this.video.currentTime = time;
            } catch (error) {
                // seek failed
                return;
            }

            if (this.danmaku) {
                this.danmaku.seek();
            }

            this.template.ptime.innerHTML = utils.secondToTime(time);
            if (!quiet) {
                this.notice(this.tran('Synchronized'));
            }
        }
    }

    /**
     * Play video
     */
    play(fromNative = false): void {
        this.paused = false;
        if (this.video.paused && !utils.isMobile) {
            this.bezel.switch(Icons.play);
        }

        this.template.playButton.innerHTML = Icons.pause;
        this.template.mobilePlayButton.innerHTML = Icons.pause;

        // if live, sync video in advance
        if (this.options.live && this.options.syncWhenPlayingLive) {
            this.sync(true);
        }

        if (!fromNative) {
            const playedPromise = Promise.resolve(this.video.play());
            playedPromise
                .catch(() => {
                    this.pause();
                })
                .then(() => {
                    // pass
                });
        }
        this.timer.enable('loading');
        this.container.classList.remove('dplayer-paused');
        this.container.classList.add('dplayer-playing');
        if (this.danmaku) {
            this.danmaku.play();
        }
        if (this.options.mutex) {
            for (let i = 0; i < instances.length; i++) {
                if (this !== instances[i]) {
                    instances[i].pause();
                }
            }
        }
    }

    /**
     * Pause video
     */
    pause(fromNative = false): void {
        this.paused = true;
        this.container.classList.remove('dplayer-loading');

        if (!this.video.paused && !utils.isMobile) {
            this.bezel.switch(Icons.pause);
        }

        this.template.playButton.innerHTML = Icons.play;
        this.template.mobilePlayButton.innerHTML = Icons.play;
        if (!fromNative) {
            this.video.pause();
        }
        this.timer.disable('loading');
        this.container.classList.remove('dplayer-playing');
        this.container.classList.add('dplayer-paused');
        if (this.danmaku) {
            this.danmaku.pause();
        }
    }

    switchVolumeIcon(): void {
        if (this.volume() >= 0.95) {
            this.template.volumeIcon.innerHTML = Icons.volumeUp;
        } else if (this.volume() > 0) {
            this.template.volumeIcon.innerHTML = Icons.volumeDown;
        } else {
            this.template.volumeIcon.innerHTML = Icons.volumeOff;
        }
    }

    /**
     * Set volume
     */
    volume(percentage: number | string = NaN, nostorage = false, nonotice = false): number {
        if (typeof percentage === 'string') {
            percentage = parseFloat(percentage);
        }
        if (!isNaN(percentage)) {
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.bar.set('volume', percentage, 'width');
            const formatPercentage = `${(percentage * 100).toFixed(0)}%`;
            this.template.volumeBarWrapWrap.ariaLabel = formatPercentage;
            if (!nostorage) {
                this.user.set('volume', percentage);
            }
            if (!nonotice) {
                this.notice(`${this.tran('Volume')} ${(percentage * 100).toFixed(0)}%`);
            }

            this.video.volume = percentage;
            if (this.video.muted) {
                this.video.muted = false;
            }
            this.switchVolumeIcon();
        }

        return this.video.volume;
    }

    /**
     * Toggle between play and pause
     */
    toggle(): void {
        if (this.video.paused) {
            this.play();
        } else {
            this.pause();
        }
    }

    /**
     * attach event
     */
    on(name: DPlayerType.Events, callback: (info?: any) => void): void {
        this.events.on(name, callback);
    }

    /**
     * Switch to a new video
     *
     * @param {Object} video - new video info
     * @param {Object} danmaku - new danmaku info
     */
    switchVideo(video: { url: string; type?: DPlayerType.VideoType | string; pic?: string; }, danmakuAPI?: DPlayerType.Danmaku): void {
        this.pause();
        this.video.poster = video.pic ? video.pic : '';
        this.video.src = video.url;
        this.initMSE(this.video, video.type || 'auto');
        if (danmakuAPI) {
            this.template.danmakuLoading.style.display = 'block';
            this.bar.set('played', 0, 'width');
            this.bar.set('loaded', 0, 'width');
            this.template.ptime.innerHTML = '00:00';
            this.template.danmaku.innerHTML = '';
            if (this.danmaku) {
                this.danmaku.reload({
                    id: danmakuAPI.id,
                    address: danmakuAPI.api,
                    token: danmakuAPI.token,
                    maximum: danmakuAPI.maximum,
                    addition: danmakuAPI.addition,
                    user: danmakuAPI.user,
                });
            }
        }
    }

    initMSE(video: HTMLVideoElement, type: DPlayerType.VideoType | string): void {
        this.type = type;
        if (this.options.video.customType && this.options.video.customType[type]) {
            if (Object.prototype.toString.call(this.options.video.customType[type]) === '[object Function]') {
                this.options.video.customType[type](this.video, this);
            } else {
                console.error(`Illegal customType: ${type}`);
            }
        } else {
            if (this.type === 'auto') {
                if (/m3u8(#|\?|$)/i.exec(video.src)) {
                    this.type = 'hls';
                } else if (/.ts(#|\?|$)/i.exec(video.src)) {
                    this.type = 'mpegts';
                } else if (/.flv(#|\?|$)/i.exec(video.src)) {
                    this.type = 'flv';
                } else if (/.mpd(#|\?|$)/i.exec(video.src)) {
                    this.type = 'dash';
                } else {
                    this.type = 'normal';
                }
            }
            if (!(this.type === 'mpegts' || this.type === 'live-llhls-for-KonomiTV')) {
                // audio switching is enabled only when using mpegts.js or live-llhls-for-KonomiTV
                this.container.classList.add('dplayer-no-audio-switching');
            }

            switch (this.type) {
                // https://github.com/video-dev/hls.js
                case 'hls':
                    if (window.Hls) {
                        // iPad Safari supports hls.js (MSE), but it's unstable and should be disabled
                        const isiPadSafari = (
                            /Safari/i.test(navigator.userAgent) &&
                            (/iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document) &&
                            (video.canPlayType('application/x-mpegURL') || video.canPlayType('application/vnd.apple.mpegURL'))
                        );
                        if (window.Hls.isSupported() && !isiPadSafari) {
                            // If it has already been initialized, destroy it once
                            if (this.plugins.hls) {
                                this.plugins.hls.destroy();
                                delete this.plugins.hls;
                                // destroy aribb24 caption
                                if (this.plugins.aribb24Caption) {
                                    this.plugins.aribb24Caption.dispose();
                                    delete this.plugins.aribb24Caption;
                                }
                                // destroy aribb24 superimpose
                                if (this.plugins.aribb24Superimpose) {
                                    this.plugins.aribb24Superimpose.dispose();
                                    delete this.plugins.aribb24Superimpose;
                                }
                            }

                            // Initialize hls.js
                            const hlsOptions = this.options.pluginOptions.hls;
                            const hls = new window.Hls(hlsOptions);
                            this.plugins.hls = hls;
                            hls.loadSource(video.src);
                            hls.attachMedia(video);

                            // Processing when destroy
                            this.events.on('destroy', () => {
                                hls.destroy();
                                delete this.plugins.hls;
                                // destroy aribb24 caption
                                if (this.plugins.aribb24Caption) {
                                    this.plugins.aribb24Caption.dispose();
                                    delete this.plugins.aribb24Caption;
                                }
                                // destroy aribb24 superimpose
                                if (this.plugins.aribb24Superimpose) {
                                    this.plugins.aribb24Superimpose.dispose();
                                    delete this.plugins.aribb24Superimpose;
                                }
                            });

                            // Initialize aribb24.js
                            // https://github.com/monyone/aribb24.js
                            if (this.options.subtitle && this.options.subtitle.type === 'aribb24') {
                                // Set options
                                if (this.options.pluginOptions.aribb24 === undefined) {
                                    this.options.pluginOptions.aribb24 = {};
                                }
                                this.options.pluginOptions.aribb24.enableAutoInBandMetadataTextTrackDetection = false; // for hls.js
                                const aribb24Options = this.options.pluginOptions.aribb24;

                                // Initialize aribb24 caption
                                const aribb24Caption = this.plugins.aribb24Caption = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x80},
                                );
                                aribb24Caption.attachMedia(video);
                                aribb24Caption.show();

                                // Initialize aribb24 superimpose
                                const aribb24Superimpose = this.plugins.aribb24Superimpose = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x81},
                                );
                                aribb24Superimpose.attachMedia(video);
                                aribb24Superimpose.show();

                                // Push caption data into CanvasRenderer
                                hls.on(window.Hls.Events.FRAG_PARSING_METADATA, (event, data) => {
                                    for (const sample of data.samples) {
                                        aribb24Caption.pushID3v2Data(sample.pts, sample.data);
                                        aribb24Superimpose.pushID3v2Data(sample.pts, sample.data);
                                    }
                                });
                            }
                        } else if (video.canPlayType('application/x-mpegURL') || video.canPlayType('application/vnd.apple.mpegURL')) {
                            // Normal playback
                            // If it has already been initialized, destroy it once
                            if (this.plugins.aribb24Caption) {
                                this.plugins.aribb24Caption.dispose();
                                delete this.plugins.aribb24Caption;
                            }
                            if (this.plugins.aribb24Superimpose) {
                                this.plugins.aribb24Superimpose.dispose();
                                delete this.plugins.aribb24Superimpose;
                            }

                            // Processing when destroy
                            this.events.on('destroy', () => {
                                // destroy aribb24 caption
                                if (this.plugins.aribb24Caption) {
                                    this.plugins.aribb24Caption.dispose();
                                    delete this.plugins.aribb24Caption;
                                }
                                // destroy aribb24 superimpose
                                if (this.plugins.aribb24Superimpose) {
                                    this.plugins.aribb24Superimpose.dispose();
                                    delete this.plugins.aribb24Superimpose;
                                }
                            });

                            // Initialize aribb24.js
                            // https://github.com/monyone/aribb24.js
                            if (this.options.subtitle && this.options.subtitle.type === 'aribb24') {
                                // Set options
                                if (this.options.pluginOptions.aribb24 === undefined) {
                                    this.options.pluginOptions.aribb24 = {};
                                }
                                this.options.pluginOptions.aribb24.enableAutoInBandMetadataTextTrackDetection = true; // for Safari native HLS player
                                const aribb24Options = this.options.pluginOptions.aribb24;

                                // Initialize aribb24 caption
                                const aribb24Caption = this.plugins.aribb24Caption = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x80},
                                );
                                aribb24Caption.attachMedia(video);
                                aribb24Caption.show();

                                // Initialize aribb24 superimpose
                                const aribb24Superimpose = this.plugins.aribb24Superimpose = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x81},
                                );
                                aribb24Superimpose.attachMedia(video);
                                aribb24Superimpose.show();
                            }
                        } else {
                            this.notice('Error: HLS is not supported.');
                        }
                    } else {
                        this.notice('Error: Can\'t find hls.js.');
                    }
                    break;
                // only for KonomiTV
                // https://github.com/tsukumijima/KonomiTV
                case 'live-llhls-for-KonomiTV':

                    // If it has already been initialized, destroy it once
                    if (this.plugins.liveLLHLSForKonomiTV) {
                        axios.delete(`${this.plugins.liveLLHLSForKonomiTV.baseUrl}/${this.plugins.liveLLHLSForKonomiTV.clientId}`);
                        delete this.plugins.liveLLHLSForKonomiTV;
                        if (this.plugins.aribb24Caption) {
                            this.plugins.aribb24Caption.dispose();
                            delete this.plugins.aribb24Caption;
                        }
                        if (this.plugins.aribb24Superimpose) {
                            this.plugins.aribb24Superimpose.dispose();
                            delete this.plugins.aribb24Superimpose;
                        }
                    }

                    (async () => {

                        // Initialize LL-HLS streaming session for KonomiTV

                        // get client id (API: /api/streams/live/:channel_id/:quality/ll-hls)
                        const baseUrl = this.quality !== null ? this.quality.url : this.options.video.url!;
                        const clientId = (await axios.post(baseUrl)).data.client_id;

                        const switchSource = (secondaryAudio = false) => {
                            let sourceUrl = baseUrl.replace('/ll-hls', `/ll-hls/${clientId}/primary-audio/playlist.m3u8`);
                            if (secondaryAudio === true) {
                                sourceUrl = baseUrl.replace('/ll-hls', `/ll-hls/${clientId}/secondary-audio/playlist.m3u8`);
                            }
                            if (video.src === sourceUrl) {
                                return;
                            }

                            // load source
                            const isPaused = video.paused;
                            video.src = sourceUrl;
                            video.load();

                            // Initialize aribb24.js
                            // https://github.com/monyone/aribb24.js
                            if (this.plugins.aribb24Caption) {
                                this.plugins.aribb24Caption.dispose();
                            }
                            if (this.plugins.aribb24Superimpose) {
                                this.plugins.aribb24Superimpose.dispose();
                            }
                            if (this.options.subtitle && this.options.subtitle.type === 'aribb24') {
                                // Set options
                                if (this.options.pluginOptions.aribb24 === undefined) {
                                    this.options.pluginOptions.aribb24 = {};
                                }
                                this.options.pluginOptions.aribb24.enableAutoInBandMetadataTextTrackDetection = true; // for Safari native HLS player
                                const aribb24Options = this.options.pluginOptions.aribb24;

                                // Initialize aribb24 caption
                                const aribb24Caption = this.plugins.aribb24Caption = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x80},
                                );
                                aribb24Caption.attachMedia(video);
                                aribb24Caption.show();

                                // Initialize aribb24 superimpose
                                const aribb24Superimpose = this.plugins.aribb24Superimpose = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x81},
                                );
                                aribb24Superimpose.attachMedia(video);
                                aribb24Superimpose.show();
                            }

                            if (!isPaused) {
                                video.play();
                            }
                        };
                        const liveLLHLSForKonomiTV = {
                            baseUrl: baseUrl,
                            clientId: clientId,
                            switchPrimaryAudio() {
                                switchSource(false);
                            },
                            switchSecondaryAudio() {
                                switchSource(true);
                            },
                        };
                        this.plugins.liveLLHLSForKonomiTV = liveLLHLSForKonomiTV;

                        // replace video source
                        switchSource(false);

                        // Processing when destroy
                        this.events.on('destroy', () => {
                            if (this.plugins.liveLLHLSForKonomiTV === undefined) return;
                            axios.delete(`${this.plugins.liveLLHLSForKonomiTV.baseUrl}/${this.plugins.liveLLHLSForKonomiTV.clientId}`);
                            delete this.plugins.liveLLHLSForKonomiTV;
                            // destroy aribb24 caption
                            if (this.plugins.aribb24Caption) {
                                this.plugins.aribb24Caption.dispose();
                                delete this.plugins.aribb24Caption;
                            }
                            // destroy aribb24 superimpose
                            if (this.plugins.aribb24Superimpose) {
                                this.plugins.aribb24Superimpose.dispose();
                                delete this.plugins.aribb24Superimpose;
                            }
                        });

                    })();

                    break;
                // https://github.com/xqq/mpegts.js
                case 'mpegts':
                    if (window.mpegts) {
                        if (window.mpegts.isSupported()) {
                            // If it has already been initialized, destroy it once
                            const source = video.src;
                            if (this.plugins.mpegts) {
                                this.plugins.mpegts.unload();
                                this.plugins.mpegts.detachMediaElement();
                                this.plugins.mpegts.destroy();
                                delete this.plugins.mpegts;
                                // destroy aribb24 caption
                                if (this.plugins.aribb24Caption) {
                                    this.plugins.aribb24Caption.dispose();
                                    delete this.plugins.aribb24Caption;
                                }
                                // destroy aribb24 superimpose
                                if (this.plugins.aribb24Superimpose) {
                                    this.plugins.aribb24Superimpose.dispose();
                                    delete this.plugins.aribb24Superimpose;
                                }
                            }

                            // Initialize mpegts.js
                            if (this.options.pluginOptions.mpegts === undefined) {
                                this.options.pluginOptions.mpegts = {};
                            }
                            const mpegtsPlayer = window.mpegts.createPlayer(
                                Object.assign(this.options.pluginOptions.mpegts.mediaDataSource || {}, {
                                    type: 'mpegts',
                                    isLive: this.options.live,
                                    url: source,
                                }),
                                this.options.pluginOptions.mpegts.config,
                            );
                            this.plugins.mpegts = mpegtsPlayer;
                            mpegtsPlayer.attachMediaElement(video);
                            mpegtsPlayer.load();

                            // Processing when destroy
                            this.events.on('destroy', () => {
                                mpegtsPlayer.unload();
                                mpegtsPlayer.detachMediaElement();
                                mpegtsPlayer.destroy();
                                delete this.plugins.mpegts;
                                // destroy aribb24 caption
                                if (this.plugins.aribb24Caption) {
                                    this.plugins.aribb24Caption.dispose();
                                    delete this.plugins.aribb24Caption;
                                }
                                // destroy aribb24 superimpose
                                if (this.plugins.aribb24Superimpose) {
                                    this.plugins.aribb24Superimpose.dispose();
                                    delete this.plugins.aribb24Superimpose;
                                }
                            });

                            // Initialize aribb24.js
                            // https://github.com/monyone/aribb24.js
                            if (this.options.subtitle && this.options.subtitle.type === 'aribb24') {
                                // Set options
                                if (this.options.pluginOptions.aribb24 === undefined) {
                                    this.options.pluginOptions.aribb24 = {};
                                }
                                this.options.pluginOptions.aribb24.enableAutoInBandMetadataTextTrackDetection = false; // for mpegts.js
                                const aribb24Options = this.options.pluginOptions.aribb24;

                                // Initialize aribb24 caption
                                const aribb24Caption = this.plugins.aribb24Caption = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x80},
                                );
                                aribb24Caption.attachMedia(video);
                                aribb24Caption.show();

                                // Initialize aribb24 superimpose
                                const aribb24Superimpose = this.plugins.aribb24Superimpose = new aribb24js.CanvasRenderer(
                                    {...aribb24Options, data_identifier: 0x81},
                                );
                                aribb24Superimpose.attachMedia(video);
                                aribb24Superimpose.show();

                                // Push caption data into CanvasRenderer
                                mpegtsPlayer.on(window.mpegts.Events.TIMED_ID3_METADATA_ARRIVED, (data) => {
                                    aribb24Caption.pushID3v2Data(data.pts / 1000, data.data);
                                    aribb24Superimpose.pushID3v2Data(data.pts / 1000, data.data);
                                });
                            }
                        } else {
                            this.notice('Error: mpegts.js is not supported.');
                        }
                    } else {
                        this.notice('Error: Can\'t find mpegts.js.');
                    }
                    break;
                // https://github.com/Bilibili/flv.js
                case 'flv':
                    if (window.flvjs) {
                        if (window.flvjs.isSupported()) {
                            if (this.options.pluginOptions.flv === undefined) {
                                this.options.pluginOptions.flv = {};
                            }
                            const flvPlayer = window.flvjs.createPlayer(
                                Object.assign(this.options.pluginOptions.flv.mediaDataSource || {}, {
                                    type: 'flv',
                                    url: video.src,
                                }),
                                this.options.pluginOptions.flv.config,
                            );
                            this.plugins.flvjs = flvPlayer;
                            flvPlayer.attachMediaElement(video);
                            flvPlayer.load();
                            this.events.on('destroy', () => {
                                flvPlayer.unload();
                                flvPlayer.detachMediaElement();
                                flvPlayer.destroy();
                                delete this.plugins.flvjs;
                            });
                        } else {
                            this.notice('Error: flv.js is not supported.');
                        }
                    } else {
                        this.notice('Error: Can\'t find flv.js.');
                    }
                    break;
                // https://github.com/Dash-Industry-Forum/dash.js
                case 'dash':
                    if (window.dashjs) {
                        const dashjsPlayer = window.dashjs.MediaPlayer().create();
                        dashjsPlayer.initialize(video, video.src, false);
                        const options = this.options.pluginOptions.dash;
                        dashjsPlayer.updateSettings(options ?? {});
                        this.plugins.dash = dashjsPlayer;
                        this.events.on('destroy', () => {
                            this.plugins.dash.reset();
                            delete this.plugins.dash;
                        });
                    } else {
                        this.notice('Error: Can\'t find dash.js.');
                    }
                    break;

                // https://github.com/webtorrent/webtorrent
                case 'webtorrent':
                    if (window.WebTorrent) {
                        if (window.WebTorrent.WEBRTC_SUPPORT) {
                            this.container.classList.add('dplayer-loading');
                            const options = this.options.pluginOptions.webtorrent;
                            const client = new window.WebTorrent(options);
                            this.plugins.webtorrent = client;
                            const torrentId = video.src;
                            video.src = '';
                            video.preload = 'metadata';
                            video.addEventListener('durationchange', () => this.container.classList.remove('dplayer-loading'), { once: true });
                            client.add(torrentId, (torrent) => {
                                const file = torrent.files.find((file) => file.name.endsWith('.mp4'));
                                if (file) {
                                    file.renderTo(this.video, {
                                        autoplay: this.options.autoplay,
                                        controls: false,
                                    });
                                }
                            });
                            this.events.on('destroy', () => {
                                client.remove(torrentId);
                                client.destroy();
                                delete this.plugins.webtorrent;
                            });
                        } else {
                            this.notice('Error: Webtorrent is not supported.');
                        }
                    } else {
                        this.notice('Error: Can\'t find Webtorrent.');
                    }
                    break;
            }
        }
    }

    initVideo(video: HTMLVideoElement, type: DPlayerType.VideoType | string): void {
        this.initMSE(video, type);

        /**
         * video events
         */
        // show video time: the metadata has loaded or changed
        this.on('durationchange', () => {
            // compatibility: Android browsers will output 1 or Infinity at first
            if (video.duration !== 1 && video.duration !== Infinity) {
                this.template.dtime.innerHTML = utils.secondToTime(video.duration);
            }
        });

        // show video loaded bar: to inform interested parties of progress downloading the media
        this.on('progress', () => {
            const duration = utils.getVideoDuration(this.video, this.template);
            const percentage = video.buffered.length ? video.buffered.end(video.buffered.length - 1) / duration : 0;
            this.bar.set('loaded', percentage, 'width');
        });

        // video download error: an error occurs
        this.on('error', () => {
            if (!this.video.error) {
                // Not a video load error, may be poster load failed, see #307
                return;
            }
            // quality switching failed
            if (this.switchingQuality) {
                if (this.prevVideo !== null) {
                    this.template.videoWrapAspect.removeChild(this.prevVideo);
                }
                this.video.classList.add('dplayer-video-current');
                this.prevVideo = null;
                this.switchingQuality = false;
                this.events.trigger('quality_end');
            }
            if (this.tran && this.notice && this.type !== 'webtorrent' && this.type !== 'live-llhls-for-KonomiTV') {
                this.notice(this.tran('Video load failed'), -1);
            }
            this.container.classList.remove('dplayer-loading');
        });

        // video end
        this.on('ended', () => {
            this.bar.set('played', 1, 'width');
            if (!this.setting.loop) {
                this.pause();
            } else {
                this.seek(0);
                this.play();
            }
            if (this.danmaku) {
                this.danmaku.danIndex = 0;
            }
        });

        this.on('play', () => {
            if (this.paused) {
                this.play(true);
            }
        });

        this.on('pause', () => {
            if (!this.paused) {
                this.pause(true);
            }
        });

        this.on('timeupdate', () => {
            const duration = utils.getVideoDuration(this.video, this.template);
            this.bar.set('played', this.video.currentTime / duration, 'width');
            const currentTime = utils.secondToTime(this.video.currentTime);
            if (this.template.ptime.innerHTML !== currentTime) {
                this.template.ptime.innerHTML = currentTime;
            }
        });

        for (let i = 0; i < this.events.videoEvents.length; i++) {
            video.addEventListener(this.events.videoEvents[i], () => {
                this.events.trigger(this.events.videoEvents[i]);
            });
        }

        this.volume(this.user.get('volume'), true, true);

        if (this.options.subtitle) {
            this.subtitle = new Subtitle(this.template.subtitle, this.video, this.plugins, this.options.subtitle, this.events);
            if (!this.user.get('subtitle')) {
                this.subtitle.hide();
            }
        }
    }

    switchQuality(index: number): void {
        index = typeof index === 'string' ? parseInt(index) : index;
        if (this.options.video.quality === undefined || this.qualityIndex === index || this.switchingQuality) {
            return;
        } else {
            this.qualityIndex = index;
        }
        this.switchingQuality = true;
        this.quality = this.options.video.quality[index];

        const paused = this.video.paused;
        this.video.pause();
        const videoHTML = tplVideo({
            current: false,
            pic: null,
            screenshot: this.options.screenshot,
            preload: 'auto',
            url: this.quality.type === 'live-llhls-for-KonomiTV' ? '' : this.quality.url,
            subtitle: this.options.subtitle,
        });
        const videoEle = new DOMParser().parseFromString(videoHTML, 'text/html').body.firstChild as HTMLVideoElement;
        this.template.videoWrapAspect.insertBefore(videoEle, this.template.videoWrapAspect.getElementsByTagName('div')[0]);
        this.prevVideo = this.video;
        this.video = videoEle;
        this.initVideo(this.video, this.quality.type || this.options.video.type);
        if (!this.options.live) {
            this.seek(this.prevVideo.currentTime);
        }
        if (this.options.lang === 'ja' || this.options.lang === 'ja-jp') {
            this.notice(`画質を ${this.quality.name} に切り替えています…`, -1);
        } else {
            this.notice(`${this.tran('Switching to')} ${this.quality.name} ${this.tran('quality')}`, -1);
        }
        this.container.classList.add('dplayer-loading');
        this.events.trigger('quality_start', this.quality);

        this.template.qualityItem.forEach((elem) => {
            elem.classList.remove('dplayer-setting-quality-current');
            if (parseInt(elem.dataset.index!) === index) {
                elem.classList.add('dplayer-setting-quality-current');
                this.template.qualityValue.textContent = this.quality!.name;
                this.template.settingBox.classList.remove('dplayer-setting-box-quality');
            }
        });

        this.on('canplay', () => {
            if (this.prevVideo !== null) {
                if (!this.options.live && this.video.currentTime !== this.prevVideo.currentTime) {
                    this.seek(this.prevVideo.currentTime);
                    return;
                }
                this.template.videoWrapAspect.removeChild(this.prevVideo);
                this.video.classList.add('dplayer-video-current');
                if (!paused) {
                    this.video.play();
                }
                this.prevVideo = null;
                if (this.options.lang === 'ja' || this.options.lang === 'ja-jp') {
                    this.notice(`画質を ${this.quality!.name} に切り替えました。`, 1000);
                } else {
                    this.notice(`${this.tran('Switched to')} ${this.quality!.name} ${this.tran('quality')}`);
                }
                this.switchingQuality = false;

                // restore speed
                const speed = parseFloat(this.template.settingBox.querySelector<HTMLElement>('.dplayer-setting-speed-current')!.dataset.speed!);
                this.speed(speed);

                // restore audio
                const audio = this.template.settingBox.querySelector<HTMLElement>('.dplayer-setting-audio-current')!.dataset.audio!;
                if (audio === 'secondary') {
                    // switch secondary audio
                    if (window.mpegts && this.plugins.mpegts && this.plugins.mpegts instanceof window.mpegts.MSEPlayer) {
                        (this.plugins.mpegts as Mpegts.MSEPlayer).switchSecondaryAudio();
                    } else if (this.plugins.liveLLHLSForKonomiTV) {
                        this.plugins.liveLLHLSForKonomiTV.switchSecondaryAudio();
                    }
                }

                this.container.classList.remove('dplayer-loading');
                this.events.trigger('quality_end');
            }
        });
    }

    notice(text: string, time = 2000, opacity = 0.8): void {
        this.template.notice.innerHTML = text;
        this.template.notice.style.opacity = `${opacity}`;
        if (this.noticeTime) {
            window.clearTimeout(this.noticeTime);
        }
        this.events.trigger('notice_show', text);
        if (time > 0) {
            this.noticeTime = window.setTimeout(() => {
                this.template.notice.style.opacity = '0';
                this.events.trigger('notice_hide');
            }, time);
        }
    }

    resize(): void {
        if (this.danmaku) {
            this.danmaku.resize();
        }
        if (this.plugins.aribb24Caption) {
            this.plugins.aribb24Caption.refresh();
        }
        if (this.plugins.aribb24Superimpose) {
            this.plugins.aribb24Superimpose.refresh();
        }
        if (this.controller.thumbnails) {
            this.controller.thumbnails.resize(160, (this.video.videoHeight / this.video.videoWidth) * 160, this.template.barWrap.offsetWidth);
        }
        this.events.trigger('resize');
    }

    speed(rate: number): void {
        this.video.playbackRate = rate;
        this.template.speedItem.forEach((elem) => {
            elem.classList.remove('dplayer-setting-speed-current');
            if (parseFloat(elem.dataset.speed!) === rate) {
                elem.classList.add('dplayer-setting-speed-current');
                if (parseFloat(elem.dataset.speed!) === 1) {
                    this.template.speedValue.textContent = this.tran('Normal');
                } else {
                    this.template.speedValue.textContent = `${rate}`;
                }
                this.template.settingBox.classList.remove('dplayer-setting-box-speed');
            }
        });
    }

    destroy(): void {
        instances.splice(instances.indexOf(this), 1);
        this.pause();
        document.removeEventListener('click', this.docClickFun, true);
        this.container.removeEventListener('click', this.containerClickFun, true);
        this.fullScreen.destroy();
        this.hotkey.destroy();
        this.contextmenu.destroy();
        this.controller.destroy();
        this.timer.destroy();
        this.video.src = '';
        this.container.innerHTML = '';
        this.events.trigger('destroy');
        this.resizeObserver.disconnect();
    }

    static get version(): string {
        /* global DPLAYER_VERSION */
        // @ts-ignore
        return DPLAYER_VERSION;
    }
}

export default DPlayer;
