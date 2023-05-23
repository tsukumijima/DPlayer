import Hls, { HlsConfig } from 'hls.js';
import Mpegts from 'mpegts.js';
import FlvJs from 'flv.js';
import dashjs from 'dashjs';
import WebTorrent from 'webtorrent';
import * as aribb24js from 'aribb24.js';
import DPlayer from './player';
export type Lang = 'en' | 'zh-cn' | 'zh-tw' | 'ja' | 'ja-jp';
export type Preload = 'none' | 'metadata' | 'auto';
export type VideoType = 'auto' | 'hls' | 'live-llhls-for-KonomiTV' | 'mpegts' | 'flv' | 'dash' | 'webtorrent' | 'normal';
export type SubtitleType = 'webvtt' | 'aribb24';
export type Events = VideoEvents | PlayerEvents;
export type VideoEvents = 'abort' | 'canplay' | 'canplaythrough' | 'durationchange' | 'emptied' | 'ended' | 'error' | 'loadeddata' | 'loadedmetadata' | 'loadstart' | 'mozaudioavailable' | 'pause' | 'play' | 'playing' | 'progress' | 'ratechange' | 'seeked' | 'seeking' | 'stalled' | 'suspend' | 'timeupdate' | 'volumechange' | 'waiting';
export type PlayerEvents = 'screenshot' | 'thumbnails_show' | 'thumbnails_hide' | 'danmaku_show' | 'danmaku_hide' | 'danmaku_clear' | 'danmaku_load_start' | 'danmaku_load_end' | 'danmaku_send' | 'danmaku_opacity' | 'contextmenu_show' | 'contextmenu_hide' | 'notice_show' | 'notice_hide' | 'quality_start' | 'quality_end' | 'destroy' | 'resize' | 'fullscreen' | 'fullscreen_cancel' | 'webfullscreen' | 'webfullscreen_cancel' | 'subtitle_show' | 'subtitle_hide' | 'subtitle_change';
export type DanmakuType = 'top' | 'right' | 'bottom';
export type DanmakuSize = 'big' | 'medium' | 'small';
export type FullscreenType = 'browser' | 'web';
export interface Options {
    /**
     * @description player container
     * @default document.querySelector('.dplayer')
     */
    container?: HTMLElement;
    /**
     * @description enable live mode
     * @default false
     */
    live?: boolean;
    /**
     * @description minimum buffer size for live mode
     * @default 0.8
     */
    liveSyncMinBufferSize?: number;
    /**
     * @description sync video when playing live
     * @default true
     */
    syncWhenPlayingLive?: boolean;
    /**
     * @description enable autoplay
     * @default false
     */
    autoplay?: boolean;
    /**
     * @description player theme color
     * @default '#b7daff'
     */
    theme?: string;
    /**
     * @description enable video loop
     * @default false
     */
    loop?: boolean;
    /**
     * @description player language (values: 'en' | 'zh-cn' | 'zh-tw' | 'ja' | 'ja-jp')
     * @default navigator.language.toLowerCase()
     */
    lang?: Lang | string;
    /**
     * @description enable screenshot, if true, video and video poster must enable Cross-Origin
     * @default false
     */
    screenshot?: boolean;
    /**
     * @description enable picture in picture
     * @default true
     */
    pictureInPicture?: boolean;
    /**
     * @description enable airplay in Safari
     * @default true
     */
    airplay?: boolean;
    /**
     * @description enable hotkey, support FF, FR, volume control, play & pause
     * @default true
     */
    hotkey?: boolean;
    /**
     * @description preload video, support 'none' | 'metadata' | 'auto'
     * @default 'metadata'
     */
    preload?: Preload;
    /**
     * @description default volume, notice that player will remember user setting, default volume will not work after user set volume themselves
     * @default 1.0
     */
    volume?: number;
    /**
     * @description optional playback speed, or or you can set a custom one
     * @default [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
     */
    playbackSpeed?: number[];
    /**
     * @description showing logo in the top left corner, you can adjust its size and position by CSS
     * @default undefined
     */
    logo?: string;
    /**
     * @description getting and sending danmaku in your way
     * @default defaultApiBackend
     */
    apiBackend?: APIBackend;
    /**
     * @description video information
     */
    video: Video;
    /**
     * @description subtitle information (if not given, subtitle will not show)
     * @default undefined
     */
    subtitle?: Subtitle;
    /**
     * @description danmaku information (if not given, danmaku will not show)
     * @default undefined
     */
    danmaku?: Danmaku;
    /**
     * @description custom contextmenu
     * @default []
     */
    contextmenu?: ContextMenuItem[];
    /**
     * @description custom time markers upon progress bar
     * @default []
     */
    highlight?: HighlightItem[];
    /**
     * @description prevent to play multiple player at the same time, pause other players when this player start play
     * @default false
     */
    mutex?: boolean;
    /**
     * @description plugin options
     */
    pluginOptions?: PluginOptions;
}
export interface APIBackend {
    /**
     * @description read danmaku from API backend
     * @param options API backend read options
     */
    read(options: APIBackendReadOptions): void;
    /**
     * @description send danmaku to API backend
     * @param options API backend send options
     */
    send(options: APIBackendSendOptions): void;
}
export interface Video {
    /**
     * @description video quality
     */
    quality?: VideoQuality[];
    /**
     * @description default video quality (quality name or index)
     */
    defaultQuality?: string | number;
    /**
     * @description video url
     */
    url?: string;
    /**
     * @description video poster
     */
    pic?: string;
    /**
     * @description video thumbnails, generated by DPlayer-thumbnails
     */
    thumbnails?: string;
    /**
     * @description values: 'auto' | 'hls' | 'live-llhls-for-KonomiTV' | 'mpegts' | 'flv' | 'dash' | 'webtorrent' | 'normal' or other custom export type
     */
    type?: VideoType | string;
    /**
     * @description custom video export type implementation
     */
    customType?: {
        [key: string]: (video: HTMLVideoElement, player: DPlayer) => void;
    };
}
export interface VideoQuality {
    /**
     * @description quality name
     */
    name: string;
    /**
     * @description video url
     */
    url: string;
    /**
     * @description values: 'auto' | 'hls' | 'live-llhls-for-KonomiTV' | 'mpegts' | 'flv' | 'dash' | 'webtorrent' | 'normal' or other custom export type
     */
    type?: VideoType | string;
}
export interface Subtitle {
    /**
     * @description subtitle url (if use aribb24, url is not required)
     */
    url?: string;
    /**
     * @description subtitle export type, values: 'webvtt' | 'aribb24'
     * @default 'webvtt'
     */
    type?: SubtitleType;
    /**
     * @description subtitle font size (if use aribb24, fontSize is not used)
     * @default '20px'
     */
    fontSize?: string;
    /**
     * @description the distance between the subtitle and player bottom, values like: '10px' '10%' (if use aribb24, bottom is not used)
     * @default '40px'
     */
    bottom?: string;
    /**
     * @description subtitle color (if use aribb24, color is not used)
     * @default '#fff'
     */
    color?: string;
}
export interface Danmaku {
    /**
     * @description danmaku pool id, it must be unique (if use custom api, id is not required)
     */
    id?: string;
    /**
     * @description danmaku api url (if use custom api, api is not required)
     */
    api?: string;
    /**
     * @description back end verification token (if use custom api, token is not required)
     */
    token?: string;
    /**
     * @description danmaku maximum quantity (if use custom api, maximum is not required)
     */
    maximum?: number;
    /**
     * @description additional danmaku api url (if use custom api, addition is not required)
     */
    addition?: string[];
    /**
     * @description danmaku user name
     * @default 'DPlayer'
     */
    user?: string;
    /**
     * @description values like: '10px' '10%' | the distance between the danmaku bottom and player bottom, in order to prevent warding off subtitle
     */
    bottom?: string;
    /**
     * @description display all danmaku even though danmaku overlap, notice that player will remember user setting, default setting will not work after user set it themselves
     * @default false
     */
    unlimited?: boolean;
    /**
     * @description danmaku speed multiplier, the larger the faster
     * @default 1
     */
    speedRate?: number;
    /**
     * @description danmaku font size
     * @default 35
     */
    fontSize?: number;
}
export interface ContextMenuItem {
    text: string;
    link?: string;
    click?: ((player: DPlayer) => void);
}
export interface HighlightItem {
    text: string;
    time: number;
}
export interface PluginOptions {
    hls?: HlsConfig;
    mpegts?: {
        config?: Mpegts.Config;
        mediaDataSource?: Mpegts.MediaDataSource;
    };
    flv?: {
        config?: FlvJs.Config;
        mediaDataSource?: FlvJs.MediaDataSource;
    };
    dash?: dashjs.MediaPlayerSettingClass;
    webtorrent?: WebTorrent.Options;
    aribb24?: aribb24js.CanvasRendererOption;
}
export interface WindowExtend extends Window {
    dashjs?: typeof dashjs;
    flvjs?: typeof FlvJs;
    Hls?: typeof Hls;
    mpegts?: typeof Mpegts;
    WebTorrent?: typeof WebTorrent;
}
export interface OptionsInternal {
    container: HTMLElement;
    live: boolean;
    liveSyncMinBufferSize: number;
    syncWhenPlayingLive: boolean;
    autoplay: boolean;
    theme: string;
    loop: boolean;
    lang: Lang | string;
    screenshot: boolean;
    pictureInPicture: boolean;
    airplay: boolean;
    hotkey: boolean;
    preload: Preload;
    volume: number;
    playbackSpeed: number[];
    logo?: string;
    apiBackend: APIBackend;
    video: VideoInternal;
    subtitle?: SubtitleInternal;
    danmaku?: DanmakuInternal;
    contextmenu: ContextMenuItem[];
    highlight?: HighlightItem[];
    mutex: boolean;
    pluginOptions: PluginOptions;
}
export interface VideoInternal {
    quality?: VideoQualityInternal[];
    defaultQuality?: number;
    url?: string;
    pic?: string;
    thumbnails?: string;
    type: VideoType | string;
    customType?: {
        [key: string]: (video: HTMLVideoElement, player: DPlayer) => void;
    };
}
export interface VideoQualityInternal {
    name: string;
    url: string;
    type: VideoType | string;
}
export interface SubtitleInternal {
    url?: string;
    type: SubtitleType;
    fontSize: string;
    bottom: string;
    color: string;
}
export interface DanmakuInternal {
    id?: string;
    api?: string;
    token?: string;
    maximum?: number;
    addition?: string[];
    user: string;
    bottom?: string;
    unlimited?: boolean;
    speedRate: number;
    fontSize: number;
}
export interface Plugins {
    hls?: Hls;
    liveLLHLSForKonomiTV?: {
        baseUrl: string;
        clientId: string;
        switchPrimaryAudio(): void;
        switchSecondaryAudio(): void;
    };
    mpegts?: Mpegts.Player | Mpegts.MSEPlayer | Mpegts.NativePlayer;
    flvjs?: FlvJs.Player;
    dash?: dashjs.MediaPlayerClass;
    webtorrent?: WebTorrent.Instance;
    aribb24Caption?: aribb24js.CanvasRenderer;
    aribb24Superimpose?: aribb24js.CanvasRenderer;
}
export interface APIBackendReadOptions {
    url?: string;
    success: (danmaku: Dan[]) => void;
    error: (message?: string) => void;
}
export interface APIBackendSendOptions {
    url?: string;
    data: Dan;
    success: () => void;
    error: (message?: string) => void;
}
export interface DanmakuItem {
    text: string;
    color: string;
    type: DanmakuType;
    size: DanmakuSize;
    border?: boolean;
}
export interface Dan {
    token?: string;
    id?: string;
    author?: string;
    time: number;
    text: string;
    color: string;
    type: DanmakuType;
    size: DanmakuSize;
}
//# sourceMappingURL=types.d.ts.map