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

    show(): void {
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
        // @ts-ignore
        this.template.infoVersion.textContent = `v${DPLAYER_VERSION} ${GIT_HASH}`;
        this.template.infoType.textContent = this.player.type;
        this.template.infoUrl.textContent = this.player.options.video.url ?? 'N/A';
        this.template.infoResolution.textContent = `${this.player.video.videoWidth} x ${this.player.video.videoHeight}`;
        this.template.infoDuration.textContent = `${this.player.video.duration}`;
        if (this.player.options.danmaku && this.player.danmaku !== null) {
            this.template.infoDanmakuId.textContent = this.player.options.danmaku.id ?? 'N/A';
            this.template.infoDanmakuApi.textContent = this.player.options.danmaku.api ?? 'N/A';
            this.template.infoDanmakuAmount.textContent = `${this.player.danmaku.dan.length}`;
        }
    }

    fps(value: number): void {
        this.template.infoFPS.textContent = `${value.toFixed(1)}`;
    }
}

export default InfoPanel;
