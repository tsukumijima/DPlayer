/* global DPLAYER_VERSION GIT_HASH */
import DPlayer from './player';
import Template from './template';
import Mpegts from 'mpegts.js';
import FlvJs from 'flv.js';

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

        // Dropped Frames
        if (this.player.video['getVideoPlaybackQuality'] != undefined) {
            const quality = this.player.video.getVideoPlaybackQuality();
            this.template.infoDroppedFrames.textContent = `${quality.droppedVideoFrames} / ${quality.totalVideoFrames}`;
        } else if ((this.player.video as any)['webkitDecodedFrameCount'] != undefined) {
            const decoded: number = (this.player.video as any)['webkitDecodedFrameCount'];
            const dropped: number = (this.player.video as any)['webkitDroppedFrameCount'];
            this.template.infoDroppedFrames.textContent = `${dropped} / ${decoded}`;
        } else {
            this.template.infoDroppedFrames.textContent = `N/A`;
        }

        // Buffer Remain
        if (this.player.video.buffered.length > 0) {
            const bufferedRangeCount = this.player.video.buffered.length;
            const bufferRemain = this.player.video.buffered.end(bufferedRangeCount - 1) - this.player.video.currentTime;
            this.template.infoBufferRemain.textContent = `${bufferRemain.toFixed(3)} s`;
        } else {
            this.template.infoBufferRemain.textContent = 'N/A';
        }

        // flv.js / mpegts.js related metrics
        if (this.player.type === 'mpegts' || this.player.type === 'flv') {
            const player: Mpegts.Player | Mpegts.MSEPlayer | Mpegts.NativePlayer | FlvJs.Player | undefined =
                this.player.plugins.mpegts || this.player.plugins.flvjs;
            if (player) {
                const mediaInfo = player.mediaInfo as Mpegts.MSEPlayerMediaInfo;
                const statisticsInfo = player.statisticsInfo as Mpegts.MSEPlayerStatisticsInfo;
                this.template.infoMimeType.textContent = mediaInfo.mimeType ?? 'N/A';
                this.template.infoVideoFPS.textContent = `${mediaInfo.fps?.toFixed(3) ?? 'N/A'}`;
                if (statisticsInfo.speed != undefined) {
                    this.template.infoDownloadSpeed.textContent = `${statisticsInfo.speed.toFixed(3)} KB/s`;
                } else {
                    this.template.infoDownloadSpeed.textContent = 'N/A';
                }
            }
        } else {
            this.template.infoMimeType.textContent = 'N/A';
            this.template.infoVideoFPS.textContent = 'N/A';
            this.template.infoDownloadSpeed.textContent = 'N/A';
        }
    }

    fps(value: number): void {
        this.template.infoPageFPS.textContent = `${value.toFixed(1)}`;
    }
}

export default InfoPanel;
