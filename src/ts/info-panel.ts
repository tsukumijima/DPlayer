/* global DPLAYER_VERSION GIT_HASH */
import DPlayer from './player';
import Template from './template';

class InfoPanel {
    player: DPlayer;
    container: HTMLElement;
    template: Template;
    video: HTMLVideoElement;
    beginTime = 0;

    constructor(player: DPlayer) {
        this.player = player;
        this.container = player.template.infoPanel;
        this.template = player.template;
        this.video = player.video;

        this.template.infoPanelClose.addEventListener('click', () => {
            this.hide();
        });
    }

    show() {
        this.beginTime = Date.now();
        this.update();
        this.player.timer.enable('info');
        this.player.timer.enable('fps');
        this.container.classList.remove('dplayer-info-panel-hide');
    }

    hide(): void {
        this.player.timer.disable('info');
        this.player.timer.disable('fps');
        this.container.classList.add('dplayer-info-panel-hide');
    }

    toggle(): void {
        if (this.container.classList.contains('dplayer-info-panel-hide')) {
            this.show();
        } else {
            this.hide();
        }
    }

    update(): void {
        // @ts-expect-error TS(2304): Cannot find name 'DPLAYER_VERSION'.
        this.template.infoVersion.innerHTML = `v${DPLAYER_VERSION} ${GIT_HASH}`;
        this.template.infoType.innerHTML = this.player.type;
        this.template.infoUrl.innerHTML = this.player.options.video.url;
        this.template.infoResolution.innerHTML = `${this.player.video.videoWidth} x ${this.player.video.videoHeight}`;
        this.template.infoDuration.innerHTML = `${this.player.video.duration}`;
        if (this.player.options.danmaku && this.player.danmaku !== null) {
            this.template.infoDanmakuId.innerHTML = this.player.options.danmaku.id;
            this.template.infoDanmakuApi.innerHTML = this.player.options.danmaku.api;
            this.template.infoDanmakuAmount.innerHTML = `${this.player.danmaku.dan.length}`;
        }
    }

    fps(value: number): void {
        this.template.infoFPS.innerHTML = `${value.toFixed(1)}`;
    }
}

export default InfoPanel;
