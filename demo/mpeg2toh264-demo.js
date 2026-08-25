import { Mpeg2TsPlayer } from '/mpeg2toh264/player/index.js';
import { Deinterlacer } from '/mpeg2toh264/yadif/index.js';

// Expose the external runtime expected by DPlayer before initializing the demo players
window.mpeg2toh264 = {
    Mpeg2TsPlayer,
    Deinterlacer,
};

const MIRAKURUN_BASE_URL = 'http://127.0.0.1:40772';
const PLAYBACK_DIAGNOSTICS_WINDOW_MS = 10000;

/**
 * Measure frames that actually reach the compositor independently of conversion throughput.
 */
class PlaybackDiagnostics {
    constructor(video, onStats) {
        this.video = video;
        this.onStats = onStats;
        this.isDestroyed = false;
        this.startedAt = null;
        this.lastExpectedDisplayTime = null;
        this.lastMediaTime = null;
        this.frameHandle = null;
        this.reportTimer = null;
        this.waitingAt = null;
        this.waitingCount = 0;
        this.waitingMs = 0;
        this.samples = [];
        this.longTasks = [];
        this.initialPlaybackQuality = null;
        this.onFrame = this.onFrame.bind(this);

        // Long tasks identify main-thread stalls without treating ordinary callback jitter as a dropped video frame
        this.longTaskObserver = new PerformanceObserver((entries) => {
            const observedAt = performance.now();
            for (const entry of entries.getEntries()) {
                this.longTasks.push({at: observedAt, duration: entry.duration});
            }
            this.trim(observedAt);
        });
        try {
            this.longTaskObserver.observe({type: 'longtask'});
        } catch {
            // Browsers without Long Tasks still expose the authoritative video-frame counters below
        }

        // Start the measurement after startup buffering so load latency does not masquerade as steady-state stutter
        this.onPlaying = () => {
            if (this.startedAt === null) {
                this.startedAt = performance.now();
                this.initialPlaybackQuality = this.video.getVideoPlaybackQuality();
            }
            if (this.waitingAt !== null) {
                this.waitingMs += performance.now() - this.waitingAt;
                this.waitingAt = null;
            }
        };
        this.onWaiting = () => {
            if (this.startedAt !== null && this.waitingAt === null) {
                this.waitingAt = performance.now();
                this.waitingCount++;
            }
        };
        video.addEventListener('playing', this.onPlaying);
        video.addEventListener('waiting', this.onWaiting);

        // requestVideoFrameCallback observes compositor presentation instead of an unrelated page animation loop
        this.frameHandle = video.requestVideoFrameCallback(this.onFrame);
        this.reportTimer = window.setInterval(() => this.report(), 1000);
    }

    percentile(values, ratio) {
        // Nearest-rank percentiles preserve individual frame stalls instead of averaging them away
        if (values.length === 0) {
            return null;
        }
        const sorted = [...values].sort((left, right) => left - right);
        return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))];
    }

    trim(now) {
        // Cadence and main-thread samples use the same rolling window so their spikes can be correlated
        const oldest = now - PLAYBACK_DIAGNOSTICS_WINDOW_MS;
        this.samples = this.samples.filter((sample) => sample.at >= oldest);
        this.longTasks = this.longTasks.filter((task) => task.at >= oldest);
    }

    onFrame(now, metadata) {
        if (this.isDestroyed) {
            return;
        }

        // Consecutive callback metadata separates presentation cadence from media frames skipped before presentation
        if (this.startedAt !== null && this.lastExpectedDisplayTime !== null && this.lastMediaTime !== null) {
            this.samples.push({
                at: now,
                expectedIntervalMs: metadata.expectedDisplayTime - this.lastExpectedDisplayTime,
                mediaIntervalMs: (metadata.mediaTime - this.lastMediaTime) * 1000,
                callbackLatenessMs: Math.max(0, now - metadata.expectedDisplayTime),
            });
            this.trim(now);
        }
        this.lastExpectedDisplayTime = metadata.expectedDisplayTime;
        this.lastMediaTime = metadata.mediaTime;
        this.frameHandle = this.video.requestVideoFrameCallback(this.onFrame);
    }

    report() {
        if (this.isDestroyed || this.startedAt === null || this.initialPlaybackQuality === null) {
            return;
        }
        const now = performance.now();
        this.trim(now);
        const expectedIntervals = this.samples.map((sample) => sample.expectedIntervalMs);
        const mediaIntervals = this.samples.map((sample) => sample.mediaIntervalMs);
        const callbackLateness = this.samples.map((sample) => sample.callbackLatenessMs);
        const expectedIntervalMedian = this.percentile(expectedIntervals, 0.5);
        const mediaIntervalMedian = this.percentile(mediaIntervals, 0.5);
        const playbackQuality = this.video.getVideoPlaybackQuality();
        const totalFrames = playbackQuality.totalVideoFrames - this.initialPlaybackQuality.totalVideoFrames;
        const droppedFrames = playbackQuality.droppedVideoFrames - this.initialPlaybackQuality.droppedVideoFrames;
        let bufferedEnd = this.video.currentTime;

        // Only the buffered range containing the playhead can prevent an immediate playback stall
        for (let index = 0; index < this.video.buffered.length; index++) {
            if (this.video.buffered.start(index) <= this.video.currentTime &&
                this.video.currentTime <= this.video.buffered.end(index)) {
                bufferedEnd = this.video.buffered.end(index);
                break;
            }
        }
        const videoRect = this.video.getBoundingClientRect();
        const isInViewport = videoRect.bottom > 0 && videoRect.right > 0 &&
            videoRect.top < window.innerHeight && videoRect.left < window.innerWidth;

        // The rolling window shows current cadence while cumulative browser counters retain intermittent failures
        this.onStats({
            visibility: document.visibilityState,
            isInViewport,
            elapsedSeconds: (now - this.startedAt) / 1000,
            cadenceWindowSeconds: PLAYBACK_DIAGNOSTICS_WINDOW_MS / 1000,
            totalFrames,
            droppedFrames,
            droppedFrameRatio: totalFrames > 0 ? droppedFrames / totalFrames : 0,
            presentedFps: expectedIntervals.length > 0 ?
                1000 * expectedIntervals.length / expectedIntervals.reduce((total, value) => total + value, 0) : null,
            expectedIntervalMedianMs: expectedIntervalMedian,
            expectedIntervalP95Ms: this.percentile(expectedIntervals, 0.95),
            expectedIntervalMaxMs: expectedIntervals.length > 0 ? Math.max(...expectedIntervals) : null,
            presentationStutterCount: expectedIntervalMedian === null ? 0 :
                expectedIntervals.filter((value) => value > expectedIntervalMedian * 1.5).length,
            mediaIntervalMedianMs: mediaIntervalMedian,
            mediaIntervalP95Ms: this.percentile(mediaIntervals, 0.95),
            mediaIntervalMaxMs: mediaIntervals.length > 0 ? Math.max(...mediaIntervals) : null,
            mediaSkipCount: mediaIntervalMedian === null ? 0 :
                mediaIntervals.filter((value) => value > mediaIntervalMedian * 1.5).length,
            callbackLatenessP95Ms: this.percentile(callbackLateness, 0.95),
            callbackLatenessMaxMs: callbackLateness.length > 0 ? Math.max(...callbackLateness) : null,
            callbackLateOver8Ms: callbackLateness.filter((value) => value > 8).length,
            bufferAheadSeconds: Math.max(0, bufferedEnd - this.video.currentTime),
            waitingCount: this.waitingCount,
            waitingMs: this.waitingMs + (this.waitingAt === null ? 0 : now - this.waitingAt),
            longTaskCount: this.longTasks.length,
            longTaskTotalMs: this.longTasks.reduce((total, task) => total + task.duration, 0),
            longTaskMaxMs: this.longTasks.length > 0 ?
                Math.max(...this.longTasks.map((task) => task.duration)) : 0,
        });
    }

    destroy() {
        if (this.isDestroyed) {
            return;
        }
        this.isDestroyed = true;
        this.video.removeEventListener('playing', this.onPlaying);
        this.video.removeEventListener('waiting', this.onWaiting);
        if (this.frameHandle !== null) {
            this.video.cancelVideoFrameCallback(this.frameHandle);
        }
        if (this.reportTimer !== null) {
            window.clearInterval(this.reportTimer);
        }
        this.longTaskObserver.disconnect();
    }
}

/**
 * Create one independently disposable mpeg2toh264 demo player.
 * @param {object} options Demo source and control elements
 * @returns {DPlayer} Initialized DPlayer instance
 */
function createMpeg2ToH264DemoPlayer(options) {
    let deinterlacer = null;
    const player = new DPlayer({
        container: options.container,
        live: options.isLive,
        autoplay: true,
        lang: 'ja-jp',
        airplay: false,
        hotkey: true,
        pictureInPicture: false,
        screenshot: false,
        video: {
            type: 'mpeg2toh264',
            url: options.url,
        },
        subtitle: {
            type: 'aribb24',
        },
        pluginOptions: {
            // mpeg2toh264
            mpeg2toh264: {
                mediaSource: options.mediaSource.value,
                serviceId: options.serviceId,
                deinterlace: options.yadif.checked,
                deinterlacer: (video) => {
                    // Keep the concrete deinterlacer instance so the YADIF rate and film cadence remain independently switchable
                    deinterlacer = new window.mpeg2toh264.Deinterlacer(video, {
                        autoFilm: options.autoFilm.checked,
                        doubleRate: options.doubleRate.checked,
                        onStats: (stats) => {
                            options.deinterlaceStats = stats;
                        },
                    });
                    return deinterlacer;
                },
            },
            // aribb24.js
            aribb24: {
                // 文字スーパーを有効にする
                disableSuperimposeRenderer: false,
                // 描画フォント
                normalFont: `"Windows TV MaruGothic", "Rounded M+ 1m for ARIB", sans-serif`,
                // 縁取りする色
                forceStrokeColor: true,
                // 背景色
                forceBackgroundColor: (() => {
                    return undefined;
                })(),
                // DRCS 文字を対応する Unicode 文字に置換
                drcsReplacement: true,
                // 高解像度の字幕 Canvas を取得できるように
                enableRawCanvas: true,
                // 縁取りに strokeText API を利用
                useStroke: true,
                // Unicode 領域の代わりに私用面の領域を利用 (Windows TV 系フォントのみ)
                usePUA: (() => {
                    const font = 'Windows TV MaruGothic';
                    const context = document.createElement('canvas').getContext('2d');
                    context.font = '10px "Rounded M+ 1m for ARIB"';
                    context.fillText('Test', 0, 0);
                    context.font = `10px "${font}"`;
                    context.fillText('Test', 0, 0);
                    if (font.startsWith('Windows TV')) {
                        return true;
                    } else {
                        return false;
                    }
                })(),
            },
        },
    });
    const mpeg2toh264Player = player.plugins.mpeg2toh264;

    // Conversion events remain visible without opening the console while preserving the player's native event contract
    let state = 'loading';
    let progress = null;
    let conversionStats = null;
    let playbackStats = null;
    const renderStats = () => {
        options.stats.textContent = JSON.stringify({
            source: options.label,
            state,
            mediaSourceOwner: player.plugins.mpeg2toh264?.mediaSourceOwner ?? null,
            progress,
            conversion: conversionStats,
            deinterlace: options.deinterlaceStats ?? null,
            playback: playbackStats,
        }, null, 2);
    };
    mpeg2toh264Player.addEventListener('statechange', (event) => {
        state = event.detail.state;
        renderStats();
    });
    mpeg2toh264Player.addEventListener('progress', (event) => {
        progress = event.detail;
        renderStats();
    });
    mpeg2toh264Player.addEventListener('stats', (event) => {
        conversionStats = event.detail;
        renderStats();
    });
    mpeg2toh264Player.addEventListener('error', (event) => {
        state = `error: ${event.detail.error.message}`;
        renderStats();
    });

    // Keep diagnostics under the same lifetime as the DPlayer instance and update the existing report at one hertz
    const playbackDiagnostics = new PlaybackDiagnostics(player.video, (stats) => {
        playbackStats = stats;
        renderStats();
    });
    player.on('destroy', () => playbackDiagnostics.destroy());

    // YADIF mode changes apply to the current frame without rebuilding the transport-stream conversion
    options.yadif.onchange = () => {
        mpeg2toh264Player.deinterlace = options.yadif.checked;
    };
    options.doubleRate.onchange = () => {
        if (deinterlacer !== null) {
            deinterlacer.doubleRate = options.doubleRate.checked;
        }
    };
    options.autoFilm.onchange = () => {
        if (deinterlacer !== null) {
            deinterlacer.autoFilm = options.autoFilm.checked;
        }
    };
    renderStats();
    return player;
}

// Live playback selects the Mirakurun service while mpeg2toh264 selects the matching MPEG-TS service ID
const liveService = document.getElementById('mpeg2toh264-live-service');
const liveStats = document.getElementById('mpeg2toh264-live-stats');
let livePlayer = null;
fetch(`${MIRAKURUN_BASE_URL}/api/services`)
    .then((response) => response.json())
    .then((services) => {
        for (const service of services.filter((item) => item.type === 1 || item.type === 2)) {
            const option = document.createElement('option');
            option.value = JSON.stringify({ id: service.id, serviceId: service.serviceId });
            option.textContent = `${service.name} (${service.channel.type}${service.channel.channel})`;
            liveService.appendChild(option);
        }
        liveStats.textContent = `${liveService.options.length} services loaded.`;
    })
    .catch((error) => {
        liveStats.textContent = `Mirakurun service loading failed: ${error.message}`;
    });

document.getElementById('mpeg2toh264-live-play').onclick = () => {
    if (liveService.value === '') {
        liveStats.textContent = 'Select a Mirakurun service.';
        return;
    }
    livePlayer?.destroy();
    const service = JSON.parse(liveService.value);
    livePlayer = createMpeg2ToH264DemoPlayer({
        container: document.getElementById('mpeg2toh264-live-player'),
        stats: liveStats,
        label: liveService.options[liveService.selectedIndex].textContent,
        url: `${MIRAKURUN_BASE_URL}/api/services/${service.id}/stream`,
        serviceId: service.serviceId,
        isLive: true,
        mediaSource: document.getElementById('mpeg2toh264-live-media-source'),
        yadif: document.getElementById('mpeg2toh264-live-yadif'),
        doubleRate: document.getElementById('mpeg2toh264-live-double-rate'),
        autoFilm: document.getElementById('mpeg2toh264-live-auto-film'),
    });
    window.mpeg2toh264LivePlayer = livePlayer;
};
document.getElementById('mpeg2toh264-live-destroy').onclick = () => {
    livePlayer?.destroy();
    livePlayer = null;
    window.mpeg2toh264LivePlayer = null;
    liveStats.textContent = 'Live player destroyed.';
};

// Recording playback accepts either a Range-capable URL or a browser-owned local File URL
const recordingStats = document.getElementById('mpeg2toh264-recording-stats');
const recordingFile = document.getElementById('mpeg2toh264-recording-file');
let recordingPlayer = null;
let recordingObjectURL = null;
function playRecording(url, label) {
    recordingPlayer?.destroy();
    recordingPlayer = createMpeg2ToH264DemoPlayer({
        container: document.getElementById('mpeg2toh264-recording-player'),
        stats: recordingStats,
        label,
        url,
        isLive: false,
        mediaSource: document.getElementById('mpeg2toh264-recording-media-source'),
        yadif: document.getElementById('mpeg2toh264-recording-yadif'),
        doubleRate: document.getElementById('mpeg2toh264-recording-double-rate'),
        autoFilm: document.getElementById('mpeg2toh264-recording-auto-film'),
    });
    window.mpeg2toh264RecordingPlayer = recordingPlayer;
}

document.getElementById('mpeg2toh264-recording-play-url').onclick = () => {
    const url = document.getElementById('mpeg2toh264-recording-url').value.trim();
    if (url === '') {
        recordingStats.textContent = 'Enter an HTTP recording URL.';
        return;
    }
    playRecording(url, url);
};
document.getElementById('mpeg2toh264-recording-play-file').onclick = () => {
    const file = recordingFile.files[0];
    if (file === undefined) {
        recordingStats.textContent = 'Select a local TS file.';
        return;
    }
    if (recordingObjectURL !== null) {
        URL.revokeObjectURL(recordingObjectURL);
    }
    recordingObjectURL = URL.createObjectURL(file);
    playRecording(recordingObjectURL, file.name);
};
document.getElementById('mpeg2toh264-recording-destroy').onclick = () => {
    recordingPlayer?.destroy();
    recordingPlayer = null;
    window.mpeg2toh264RecordingPlayer = null;
    if (recordingObjectURL !== null) {
        URL.revokeObjectURL(recordingObjectURL);
        recordingObjectURL = null;
    }
    recordingStats.textContent = 'Recording player destroyed.';
};

window.addEventListener('beforeunload', () => {
    livePlayer?.destroy();
    recordingPlayer?.destroy();
    if (recordingObjectURL !== null) {
        URL.revokeObjectURL(recordingObjectURL);
    }
});
