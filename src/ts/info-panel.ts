/* global DPLAYER_VERSION GIT_HASH */
import DPlayer from './player';
import Template from './template';
import Mpegts from 'mpegts.js';
import FlvJs from 'flv.js';
import type { Mpeg2TsPlayer, PlayerState, Progress, Stats } from 'mpeg2toh264/player';
import type { Deinterlacer, DeinterlaceStats } from 'mpeg2toh264/yadif';

const CONVERSION_CHART_WINDOW_MS = 60_000;
const DOWNLOAD_SPEED_STALE_MS = 1500;
const NTSC_FRAME_MS = 1001 / 30;

interface ConversionChartSample {
    at: number;
    fps: number;
    rollingFps: number;
}

class InfoPanel {
    player: DPlayer;
    container: HTMLElement;
    template: Template;
    video: HTMLVideoElement;
    beginTime = 0;
    mpeg2toh264Stats: Stats | null = null;
    mpeg2toh264State: PlayerState | null = null;
    mpeg2toh264Progress: Progress | null = null;
    mpeg2toh264PictureWorkers: number | null = null;
    mpeg2toh264DeinterlaceStats: DeinterlaceStats | null = null;
    mpeg2toh264Deinterlacer: EventTarget | null = null;
    mpeg2toh264DeinterlaceListener: ((event: Event) => void) | null = null;
    mpeg2toh264DownloadSpeedKBps: number | null = null;
    lastProgressAt = 0;
    lastBytesRead = 0;
    lastPlaybackQuality: { at: number; totalVideoFrames: number } | null = null;
    presentedFps: number | null = null;
    conversionChartSamples: ConversionChartSample[] = [];

    constructor(player: DPlayer) {
        this.player = player;
        this.container = player.template.infoPanel;
        this.template = player.template;
        this.video = player.video;

        this.template.infoPanelClose.addEventListener('click', () => {
            this.hide();
        });

        // Keep the canvas backing store aligned with the CSS box
        new ResizeObserver(() => {
            this.drawConversionChart();
        }).observe(this.template.infoConversionChart);
    }

    show(): void {
        this.beginTime = Date.now();
        // Opening the panel must not treat the idle interval as one presented-FPS sample
        this.lastPlaybackQuality = null;
        this.presentedFps = null;
        this.update();
        this.player.timer.enable('info');
        this.player.timer.enable('fps');
        this.container.classList.remove('dplayer-info-panel-hide');
        this.drawConversionChart();
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
            this.updatePresentedFps(quality.totalVideoFrames);
        } else if ((this.player.video as any)['webkitDecodedFrameCount'] != undefined) {
            const decoded: number = (this.player.video as any)['webkitDecodedFrameCount'];
            const dropped: number = (this.player.video as any)['webkitDroppedFrameCount'];
            this.template.infoDroppedFrames.textContent = `${dropped} / ${decoded}`;
            this.updatePresentedFps(decoded);
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

        const isMpeg2ToH264 = this.player.type === 'mpeg2toh264';
        this.template.infoMpeg2ToH264.classList.toggle('dplayer-info-panel-mpeg2toh264-hide', !isMpeg2ToH264);

        // flv.js and mpegts.js expose ready-made media and throughput metadata
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
        } else if (isMpeg2ToH264) {
            this.updateMpeg2ToH264();
        } else {
            this.template.infoMimeType.textContent = 'N/A';
            this.template.infoVideoFPS.textContent = 'N/A';
            this.template.infoDownloadSpeed.textContent = 'N/A';
        }
    }

    updateMpeg2ToH264(): void {
        const mpeg2toh264Player = this.player.plugins.mpeg2toh264;
        this.template.infoMimeType.textContent = 'video/mp2t';

        // mpeg2toh264 does not publish header FPS; measure frames the element actually presented
        this.template.infoVideoFPS.textContent =
            this.presentedFps === null ? 'N/A' : `${this.presentedFps.toFixed(3)}`;

        const downloadAge = performance.now() - this.lastProgressAt;
        // Progress stops arriving while conversion waits on a full buffer, so a stale rate must not linger
        if (this.mpeg2toh264DownloadSpeedKBps === null) {
            this.template.infoDownloadSpeed.textContent = 'N/A';
        } else if (downloadAge > DOWNLOAD_SPEED_STALE_MS) {
            this.template.infoDownloadSpeed.textContent = '0.000 KB/s';
        } else {
            this.template.infoDownloadSpeed.textContent =
                `${this.mpeg2toh264DownloadSpeedKBps.toFixed(3)} KB/s`;
        }

        this.template.infoMode.textContent = this.formatMpeg2ToH264Mode(mpeg2toh264Player);
        this.template.infoDeinterlaceMode.textContent =
            this.formatMpeg2ToH264DeinterlaceMode(mpeg2toh264Player);

        const state = mpeg2toh264Player?.state ?? this.mpeg2toh264State;
        this.template.infoConversionState.textContent = state ?? 'N/A';

        const progress = this.mpeg2toh264Progress;
        if (!progress) {
            this.template.infoInputRead.textContent = 'N/A';
        } else if (progress.totalBytes) {
            const percent = (100 * progress.bytesRead) / progress.totalBytes;
            this.template.infoInputRead.textContent =
                `${(progress.bytesRead / 1024 / 1024).toFixed(1)} MiB / ` +
                `${(progress.totalBytes / 1024 / 1024).toFixed(1)} MiB (${percent.toFixed(1)}%)`;
        } else {
            this.template.infoInputRead.textContent =
                `${(progress.bytesRead / 1024 / 1024).toFixed(1)} MiB`;
        }

        // mpeg2toh264 may leave disjoint ranges when conversion pauses and the sink evicts
        // Buffer Ahead is the remaining media in the range that currently contains the playhead
        const ranges = this.player.video.buffered;
        const currentTime = this.player.video.currentTime;
        let bufferedEnd = currentTime;
        for (let index = 0; index < ranges.length; index++) {
            if (ranges.start(index) <= currentTime && currentTime <= ranges.end(index)) {
                bufferedEnd = ranges.end(index);
                break;
            }
        }
        this.template.infoBufferAhead.textContent =
            `${Math.max(0, bufferedEnd - currentTime).toFixed(3)} s`;

        const stats = this.mpeg2toh264Stats;
        if (stats) {
            this.template.infoTransportStream.textContent =
                `drop: ${stats.dropped} / scrambled: ${stats.scrambled} / errors: ${stats.errors}`;
            // instantFps divides by converting time only; rescale by the full busy interval including waits
            const busyMs = stats.convertingMs + stats.readingMs + stats.waitingMs;
            const elapsedFps = busyMs > 0 ? stats.instantFps * stats.convertingMs / busyMs : 0;
            // Sibling stats use `name: value unit` joined by ` / ` so each term keeps its own unit
            this.template.infoConversionFPS.textContent =
                `current: ${stats.instantFps.toFixed(1)} fps / average: ${stats.totalFps.toFixed(1)} fps / ` +
                `including waits: ${elapsedFps.toFixed(1)} fps`;
            this.template.infoConvertedFrames.textContent =
                `MPEG-2: ${stats.videoFrames} / AAC: ${stats.audioFrames}`;
            this.template.infoWorkerTime.textContent =
                `read: ${stats.readingMs.toFixed(0)} ms / convert: ${stats.convertingMs.toFixed(0)} ms / ` +
                `MSE wait: ${stats.waitingMs.toFixed(0)} ms`;
        } else {
            this.template.infoTransportStream.textContent = 'N/A';
            this.template.infoConversionFPS.textContent = 'N/A';
            this.template.infoConvertedFrames.textContent = 'N/A';
            this.template.infoWorkerTime.textContent = 'N/A';
        }

        if (this.mpeg2toh264PictureWorkers === null) {
            this.template.infoPictureWorkers.textContent = 'N/A';
        } else if (this.mpeg2toh264PictureWorkers === 0) {
            this.template.infoPictureWorkers.textContent = 'none (session worker only)';
        } else {
            this.template.infoPictureWorkers.textContent = `${this.mpeg2toh264PictureWorkers} workers`;
        }

        const deinterlacer = mpeg2toh264Player?.deinterlacer ?? null;
        const scanItem = this.template.infoScan.closest('.dplayer-info-panel-item');
        const deinterlaceItem = this.template.infoDeinterlace.closest('.dplayer-info-panel-item');
        scanItem?.classList.toggle('dplayer-info-panel-item-hide', deinterlacer === null);
        deinterlaceItem?.classList.toggle('dplayer-info-panel-item-hide', deinterlacer === null);

        const scan = deinterlacer?.scan;
        if (!scan) {
            this.template.infoScan.textContent = 'N/A';
        } else if (scan.interlaced) {
            this.template.infoScan.textContent =
                `interlaced (${scan.topFieldFirst ? 'TFF' : 'BFF'})`;
        } else {
            this.template.infoScan.textContent = 'progressive';
        }

        const deinterlace = this.mpeg2toh264DeinterlaceStats;
        if (!deinterlace) {
            this.template.infoDeinterlace.textContent =
                mpeg2toh264Player?.deinterlace ? 'running' : 'off';
        } else {
            this.template.infoDeinterlace.textContent =
                `${deinterlace.fps.toFixed(1)} fps / ${deinterlace.frameMs.toFixed(1)} ms/frame / ` +
                `filtered: ${deinterlace.filtered} / missed: ${deinterlace.missed} / ` +
                `degraded: ${deinterlace.degraded} / late: ${deinterlace.late} / ` +
                `discontinuities: ${deinterlace.discontinuities} / dropped: ${deinterlace.dropped}`;
        }

        this.drawConversionChart();
    }

    /**
     * Prefer the MediaSource the player settled on; the option is only the request
     * `auto` is not a sink, so keep it in parentheses when it differs from the owner
     */
    formatMpeg2ToH264Mode(mpeg2toh264Player: Mpeg2TsPlayer | undefined): string {
        const options = this.player.options.pluginOptions.mpeg2toh264 ?? {};
        const requestedMediaSource = options.mediaSource ?? 'auto';
        const owner = mpeg2toh264Player?.mediaSourceOwner;
        let mediaSourceText: string;
        if (owner === undefined) {
            // The plugin is not attached yet; show the request so the row is still readable
            mediaSourceText = `MediaSource: ${requestedMediaSource}`;
        } else if (requestedMediaSource === owner) {
            mediaSourceText = `MediaSource: ${owner}`;
        } else {
            mediaSourceText = `MediaSource: ${owner} (${requestedMediaSource})`;
        }

        const terms = [mediaSourceText];
        if (options.preferManagedMediaSource === true) {
            terms.push('managed: on');
        }
        terms.push(`passthrough: ${options.passthrough === true ? 'on' : 'off'}`);
        return terms.join(' / ');
    }

    /**
     * Requested on/off is the outer value; state is whether this picture is actually filtered
     * Progressive material stays idle until the source says it is interlaced again
     */
    formatMpeg2ToH264DeinterlaceMode(mpeg2toh264Player: Mpeg2TsPlayer | undefined): string {
        const wanted = mpeg2toh264Player?.deinterlaceWanted === true;
        const running = mpeg2toh264Player?.deinterlace === true;
        if (!wanted && !running) {
            return 'off';
        }

        const terms = [
            `on (state: ${running ? 'active' : 'idle'})`,
        ];
        // PlayerDeinterlacer does not publish yadif knobs; read them when this instance has them
        const deinterlacer = mpeg2toh264Player?.deinterlacer as Deinterlacer | null | undefined;
        if (deinterlacer && typeof deinterlacer.doubleRate === 'boolean') {
            const cadence = this.mpeg2toh264DeinterlaceStats?.mode;
            terms.push(`doublerate: ${deinterlacer.doubleRate ? 'on' : 'off'}`);
            if (!deinterlacer.autoFilm) {
                terms.push('autofilm: off');
            } else if (cadence) {
                terms.push(`autofilm: on (mode: ${cadence})`);
            } else {
                terms.push('autofilm: on');
            }
        }
        return terms.join(' / ');
    }

    /**
     * Count frames the element presented per elapsed second
     * MPEG-2 header FPS is not on the mpeg2toh264 public API
     */
    updatePresentedFps(totalVideoFrames: number): void {
        const now = performance.now();
        if (this.lastPlaybackQuality) {
            const elapsedSeconds = (now - this.lastPlaybackQuality.at) / 1000;
            const frameDelta = totalVideoFrames - this.lastPlaybackQuality.totalVideoFrames;
            if (elapsedSeconds > 0 && frameDelta >= 0) {
                this.presentedFps = frameDelta / elapsedSeconds;
            }
        }
        this.lastPlaybackQuality = { at: now, totalVideoFrames };
    }

    setMpeg2ToH264Stats(stats: Stats | null): void {
        this.mpeg2toh264Stats = stats;
        if (!stats) {
            this.resetMpeg2ToH264();
            return;
        }

        const last15 = this.conversionChartSamples.slice(-15);
        const rollingFps = last15.reduce((sum, sample) => sum + sample.fps, stats.instantFps) /
            (last15.length + 1);
        this.conversionChartSamples.push({
            at: performance.now(),
            fps: stats.instantFps,
            rollingFps,
        });
        const oldest = performance.now() - CONVERSION_CHART_WINDOW_MS;
        this.conversionChartSamples = this.conversionChartSamples.filter((sample) => sample.at >= oldest);
        this.drawConversionChart();
    }

    setMpeg2ToH264State(state: PlayerState | null): void {
        this.mpeg2toh264State = state;
    }

    setMpeg2ToH264Progress(progress: Progress | null): void {
        this.mpeg2toh264Progress = progress;
        if (!progress) {
            this.mpeg2toh264DownloadSpeedKBps = null;
            this.lastProgressAt = 0;
            this.lastBytesRead = 0;
            return;
        }

        const now = performance.now();
        if (this.lastProgressAt > 0) {
            const elapsedSeconds = (now - this.lastProgressAt) / 1000;
            const byteDelta = progress.bytesRead - this.lastBytesRead;
            if (elapsedSeconds > 0 && byteDelta >= 0) {
                this.mpeg2toh264DownloadSpeedKBps = (byteDelta / 1024) / elapsedSeconds;
            } else if (byteDelta < 0) {
                // A seek rewinds bytesRead; treat that interval as zero and resume from the next delta
                this.mpeg2toh264DownloadSpeedKBps = 0;
            }
        }
        this.lastProgressAt = now;
        this.lastBytesRead = progress.bytesRead;
    }

    setMpeg2ToH264PictureWorkers(pictureWorkers: number | null): void {
        this.mpeg2toh264PictureWorkers = pictureWorkers;
    }

    /**
     * Listen to yadif `stats` on the instance the page constructed
     * A factory that returns something other than EventTarget is left alone
     */
    watchMpeg2ToH264Deinterlacer(deinterlacer: object): void {
        this.unwatchMpeg2ToH264Deinterlacer();
        if (typeof (deinterlacer as EventTarget).addEventListener !== 'function') {
            return;
        }
        const target = deinterlacer as EventTarget;
        const listener = (event: Event) => {
            this.setMpeg2ToH264DeinterlaceStats((event as CustomEvent<DeinterlaceStats>).detail);
        };
        target.addEventListener('stats', listener);
        this.mpeg2toh264Deinterlacer = target;
        this.mpeg2toh264DeinterlaceListener = listener;
    }

    unwatchMpeg2ToH264Deinterlacer(): void {
        if (this.mpeg2toh264Deinterlacer && this.mpeg2toh264DeinterlaceListener) {
            this.mpeg2toh264Deinterlacer.removeEventListener('stats', this.mpeg2toh264DeinterlaceListener);
        }
        this.mpeg2toh264Deinterlacer = null;
        this.mpeg2toh264DeinterlaceListener = null;
    }

    setMpeg2ToH264DeinterlaceStats(stats: DeinterlaceStats | null): void {
        this.mpeg2toh264DeinterlaceStats = stats;
    }

    resetMpeg2ToH264(): void {
        this.unwatchMpeg2ToH264Deinterlacer();
        this.mpeg2toh264Stats = null;
        this.mpeg2toh264State = null;
        this.mpeg2toh264Progress = null;
        this.mpeg2toh264PictureWorkers = null;
        this.mpeg2toh264DeinterlaceStats = null;
        this.mpeg2toh264DownloadSpeedKBps = null;
        this.lastProgressAt = 0;
        this.lastBytesRead = 0;
        this.conversionChartSamples = [];
        this.drawConversionChart();
    }

    /**
     * Draw milliseconds per converted frame over the last 60s, matching the upstream demo axes
     * The 1001/30 ms grid line is one NTSC frame of realtime
     */
    drawConversionChart(): void {
        const canvas = this.template.infoConversionChart;
        if (this.container.classList.contains('dplayer-info-panel-hide')) {
            return;
        }

        const context = canvas.getContext('2d');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        if (!context || width <= 0 || height <= 0) {
            return;
        }

        const scale = window.devicePixelRatio || 1;
        const pixelWidth = Math.round(width * scale);
        const pixelHeight = Math.round(height * scale);
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
            canvas.width = pixelWidth;
            canvas.height = pixelHeight;
        }
        context.setTransform(scale, 0, 0, scale, 0, 0);
        context.clearRect(0, 0, width, height);

        const now = performance.now();
        const samples = this.conversionChartSamples;
        const left = 44;
        const right = 8;
        const top = 22;
        const bottom = 18;
        const plotWidth = Math.max(1, width - left - right);
        const plotHeight = Math.max(1, height - top - bottom);
        const start = now - CONVERSION_CHART_WINDOW_MS;
        const x = (sample: ConversionChartSample): number =>
            left + ((sample.at - start) / CONVERSION_CHART_WINDOW_MS) * plotWidth;
        // Scale to the samples so jitter stays readable; the NTSC line sits off-chart when conversion is well ahead of realtime
        const peakMs = samples.length === 0 ?
            NTSC_FRAME_MS :
            Math.max(...samples.map((sample) => 1000 / sample.fps));
        const timeMax = Math.max(1, Math.ceil(peakMs));
        const timeY = (value: number): number =>
            top + ((timeMax - value) / timeMax) * plotHeight;

        context.font = '11px sans-serif';
        context.lineWidth = 1;
        context.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        context.fillStyle = '#fff';
        context.textBaseline = 'middle';
        context.textAlign = 'right';
        for (const value of [timeMax, 0, NTSC_FRAME_MS, NTSC_FRAME_MS / 2]) {
            const y = timeY(value);
            context.globalAlpha = value === 0 ? 0.65 : 0.25;
            context.beginPath();
            context.moveTo(left, y);
            context.lineTo(width - right, y);
            context.stroke();
            context.globalAlpha = 1;
            context.fillText(value.toFixed(2), left - 4, y);
        }

        context.textAlign = 'left';
        context.fillStyle = '#7eb6ff';
        context.fillText('frame ms', left, top - 10);
        context.fillStyle = '#7dba7d';
        context.fillText('15-sample avg', left + 70, top - 10);
        context.fillStyle = '#fff';
        context.textBaseline = 'top';
        context.textAlign = 'center';
        for (const seconds of [-60, -30, 0]) {
            const tickX = left + ((seconds + 60) / 60) * plotWidth;
            context.fillText(`${seconds}s`, tickX, height - 14);
        }

        this.drawChartSeries(context, samples, x, (sample) => timeY(1000 / sample.fps), '#7eb6ff');
        this.drawChartSeries(context, samples, x, (sample) => timeY(1000 / sample.rollingFps), '#7dba7d');
    }

    drawChartSeries(
        context: CanvasRenderingContext2D,
        samples: ConversionChartSample[],
        x: (sample: ConversionChartSample) => number,
        y: (sample: ConversionChartSample) => number,
        color: string,
    ): void {
        if (samples.length === 0) {
            return;
        }
        context.strokeStyle = color;
        context.lineWidth = 1.5;
        context.beginPath();
        samples.forEach((sample, index) => {
            if (index === 0) {
                context.moveTo(x(sample), y(sample));
            } else {
                context.lineTo(x(sample), y(sample));
            }
        });
        context.stroke();
    }

    fps(value: number): void {
        this.template.infoPageFPS.textContent = `${value.toFixed(1)}`;
    }
}

export default InfoPanel;
