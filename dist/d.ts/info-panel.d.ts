import DPlayer from './player';
import Template from './template';
import type { Mpeg2TsPlayer, PlayerState, Progress, Stats } from 'mpeg2toh264/player';
import type { DeinterlaceStats } from 'mpeg2toh264/yadif';
interface ConversionChartSample {
    at: number;
    fps: number;
    rollingFps: number;
}
declare class InfoPanel {
    player: DPlayer;
    container: HTMLElement;
    template: Template;
    video: HTMLVideoElement;
    beginTime: number;
    mpeg2toh264Stats: Stats | null;
    mpeg2toh264State: PlayerState | null;
    mpeg2toh264Progress: Progress | null;
    mpeg2toh264PictureWorkers: number | null;
    mpeg2toh264DeinterlaceStats: DeinterlaceStats | null;
    mpeg2toh264Deinterlacer: EventTarget | null;
    mpeg2toh264DeinterlaceListener: ((event: Event) => void) | null;
    mpeg2toh264DownloadSpeedKBps: number | null;
    lastProgressAt: number;
    lastBytesRead: number;
    lastPlaybackQuality: {
        at: number;
        totalVideoFrames: number;
    } | null;
    presentedFps: number | null;
    conversionChartSamples: ConversionChartSample[];
    constructor(player: DPlayer);
    show(): void;
    hide(): void;
    toggle(): void;
    update(): void;
    updateMpeg2ToH264(): void;
    /**
     * Prefer the MediaSource the player settled on; the option is only the request
     * `auto` is not a sink, so keep it in parentheses when it differs from the owner
     */
    formatMpeg2ToH264Mode(mpeg2toh264Player: Mpeg2TsPlayer | undefined): string;
    /**
     * Requested on/off is the outer value; state is whether this picture is actually filtered
     * Progressive material stays idle until the source says it is interlaced again
     */
    formatMpeg2ToH264DeinterlaceMode(mpeg2toh264Player: Mpeg2TsPlayer | undefined): string;
    /**
     * Count frames the element presented per elapsed second
     * MPEG-2 header FPS is not on the mpeg2toh264 public API
     */
    updatePresentedFps(totalVideoFrames: number): void;
    setMpeg2ToH264Stats(stats: Stats | null): void;
    setMpeg2ToH264State(state: PlayerState | null): void;
    setMpeg2ToH264Progress(progress: Progress | null): void;
    setMpeg2ToH264PictureWorkers(pictureWorkers: number | null): void;
    /**
     * Listen to yadif `stats` on the instance the page constructed
     * A factory that returns something other than EventTarget is left alone
     */
    watchMpeg2ToH264Deinterlacer(deinterlacer: object): void;
    unwatchMpeg2ToH264Deinterlacer(): void;
    setMpeg2ToH264DeinterlaceStats(stats: DeinterlaceStats | null): void;
    resetMpeg2ToH264(): void;
    /**
     * Draw milliseconds per converted frame over the last 60s, matching the upstream demo axes
     * The 1001/30 ms grid line is one NTSC frame of realtime
     */
    drawConversionChart(): void;
    drawChartSeries(context: CanvasRenderingContext2D, samples: ConversionChartSample[], x: (sample: ConversionChartSample) => number, y: (sample: ConversionChartSample) => number, color: string): void;
    fps(value: number): void;
}
export default InfoPanel;
//# sourceMappingURL=info-panel.d.ts.map