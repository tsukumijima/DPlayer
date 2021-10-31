import Icons from './icons';
import tplPlayer from '../template/player.art';
import utils from './utils';

class Template {
    constructor(options) {
        this.container = options.container;
        this.options = options.options;
        this.index = options.index;
        this.tran = options.tran;
        this.init();
    }

    init() {
        this.container.innerHTML = tplPlayer({
            options: this.options,
            index: this.index,
            tran: this.tran,
            icons: Icons,
            mobile: utils.isMobile,
            video: {
                current: true,
                pic: this.options.video.pic,
                screenshot: this.options.screenshot,
                airplay: this.options.airplay,
                preload: this.options.preload,
                url: this.options.video.url,
                subtitle: this.options.subtitle,
            },
        });

        this.volumeBar = this.container.querySelector('.dplayer-volume-bar-inner');
        this.volumeBarWrap = this.container.querySelector('.dplayer-volume-bar');
        this.volumeBarWrapWrap = this.container.querySelector('.dplayer-volume-bar-wrap');
        this.volumeButton = this.container.querySelector('.dplayer-volume');
        this.volumeButtonIcon = this.container.querySelector('.dplayer-volume-icon');
        this.volumeIcon = this.container.querySelector('.dplayer-volume-icon .dplayer-icon-content');
        this.playedBar = this.container.querySelector('.dplayer-played');
        this.loadedBar = this.container.querySelector('.dplayer-loaded');
        this.playedBarWrap = this.container.querySelector('.dplayer-bar-wrap');
        this.playedBarTime = this.container.querySelector('.dplayer-bar-time');
        this.danmaku = this.container.querySelector('.dplayer-danmaku');
        this.danmakuLoading = this.container.querySelector('.dplayer-danloading');
        this.video = this.container.querySelector('.dplayer-video-current');
        this.bezel = this.container.querySelector('.dplayer-bezel-icon');
        this.playButton = this.container.querySelector('.dplayer-play-icon');
        this.mobileBackwardButton = this.container.querySelector('.dplayer-mobile-icon-backward');
        this.mobilePlayButton = this.container.querySelector('.dplayer-mobile-icon-play');
        this.mobileForwardButton = this.container.querySelector('.dplayer-mobile-icon-forward');
        this.videoWrap = this.container.querySelector('.dplayer-video-wrap');
        this.videoWrapAspect = this.container.querySelector('.dplayer-video-wrap-aspect');
        this.controllerMask = this.container.querySelector('.dplayer-controller-mask');
        this.ptime = this.container.querySelector('.dplayer-ptime');
        this.settingButton = this.container.querySelector('.dplayer-setting-icon');
        this.settingBox = this.container.querySelector('.dplayer-setting-box');
        this.settingOriginPanel = this.container.querySelector('.dplayer-setting-origin-panel');
        this.mask = this.container.querySelector('.dplayer-mask');
        this.syncButton = this.container.querySelector('.dplayer-live-badge');
        this.loop = this.container.querySelector('.dplayer-setting-loop');
        this.loopToggle = this.container.querySelector('.dplayer-setting-loop .dplayer-toggle-setting-input');
        this.showDanmaku = this.container.querySelector('.dplayer-setting-showdan');
        this.showDanmakuToggle = this.container.querySelector('.dplayer-showdan-setting-input');
        this.unlimitDanmaku = this.container.querySelector('.dplayer-setting-danunlimit');
        this.unlimitDanmakuToggle = this.container.querySelector('.dplayer-danunlimit-setting-input');
        this.quality = this.container.querySelector('.dplayer-setting-quality');
        this.qualityValue = this.container.querySelector('.dplayer-setting-quality .dplayer-label-value');
        this.qualityHeader = this.container.querySelector('.dplayer-setting-quality-header');
        this.qualityItem = this.container.querySelectorAll('.dplayer-setting-quality-item');
        this.speed = this.container.querySelector('.dplayer-setting-speed');
        this.speedValue = this.container.querySelector('.dplayer-setting-speed .dplayer-label-value');
        this.speedHeader = this.container.querySelector('.dplayer-setting-speed-header');
        this.speedItem = this.container.querySelectorAll('.dplayer-setting-speed-item');
        this.audio = this.container.querySelector('.dplayer-setting-audio');
        this.audioValue = this.container.querySelector('.dplayer-setting-audio .dplayer-label-value');
        this.audioHeader = this.container.querySelector('.dplayer-setting-audio-header');
        this.audioItem = this.container.querySelectorAll('.dplayer-setting-audio-item');
        this.danmakuOpacityBar = this.container.querySelector('.dplayer-danmaku-bar-inner');
        this.danmakuOpacityBarWrap = this.container.querySelector('.dplayer-danmaku-bar');
        this.danmakuOpacityBarWrapWrap = this.container.querySelector('.dplayer-danmaku-bar-wrap');
        this.danmakuOpacityBox = this.container.querySelector('.dplayer-setting-danmaku');
        this.danmakuOpacityValue = this.container.querySelector('.dplayer-setting-danmaku .dplayer-label-value');
        this.dtime = this.container.querySelector('.dplayer-dtime');
        this.controller = this.container.querySelector('.dplayer-controller');
        this.commentInput = this.container.querySelector('.dplayer-comment-input');
        this.commentButton = this.container.querySelector('.dplayer-comment-icon');
        this.commentSettingBox = this.container.querySelector('.dplayer-comment-setting-box');
        this.commentSettingButton = this.container.querySelector('.dplayer-comment-setting-icon');
        this.commentSettingFill = this.container.querySelector('.dplayer-comment-setting-icon path');
        this.commentSendButton = this.container.querySelector('.dplayer-send-icon');
        this.commentSendFill = this.container.querySelector('.dplayer-send-icon path');
        this.commentColorSettingBox = this.container.querySelector('.dplayer-comment-setting-color');
        this.browserFullButton = this.container.querySelector('.dplayer-full-icon');
        this.webFullButton = this.container.querySelector('.dplayer-full-in-icon');
        this.pipButton = this.container.querySelector('.dplayer-pip-icon');
        this.menu = this.container.querySelector('.dplayer-menu');
        this.menuItem = this.container.querySelectorAll('.dplayer-menu-item');
        this.cameraButton = this.container.querySelector('.dplayer-camera-icon');
        this.airplayButton = this.container.querySelector('.dplayer-airplay-icon');
        this.subtitleButton = this.container.querySelector('.dplayer-subtitle-icon');
        this.subtitleButtonInner = this.container.querySelector('.dplayer-subtitle-icon .dplayer-icon-content');
        this.subtitle = this.container.querySelector('.dplayer-subtitle');
        this.barPreview = this.container.querySelector('.dplayer-bar-preview');
        this.barWrap = this.container.querySelector('.dplayer-bar-wrap');
        this.notice = this.container.querySelector('.dplayer-notice');
        this.infoPanel = this.container.querySelector('.dplayer-info-panel');
        this.infoPanelClose = this.container.querySelector('.dplayer-info-panel-close');
        this.infoVersion = this.container.querySelector('.dplayer-info-panel-item-version .dplayer-info-panel-item-data');
        this.infoFPS = this.container.querySelector('.dplayer-info-panel-item-fps .dplayer-info-panel-item-data');
        this.infoType = this.container.querySelector('.dplayer-info-panel-item-type .dplayer-info-panel-item-data');
        this.infoUrl = this.container.querySelector('.dplayer-info-panel-item-url .dplayer-info-panel-item-data');
        this.infoResolution = this.container.querySelector('.dplayer-info-panel-item-resolution .dplayer-info-panel-item-data');
        this.infoDuration = this.container.querySelector('.dplayer-info-panel-item-duration .dplayer-info-panel-item-data');
        this.infoDanmakuId = this.container.querySelector('.dplayer-info-panel-item-danmaku-id .dplayer-info-panel-item-data');
        this.infoDanmakuApi = this.container.querySelector('.dplayer-info-panel-item-danmaku-api .dplayer-info-panel-item-data');
        this.infoDanmakuAmount = this.container.querySelector('.dplayer-info-panel-item-danmaku-amount .dplayer-info-panel-item-data');
    }
}

export default Template;
