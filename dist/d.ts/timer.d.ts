import DPlayer from './player';
declare class Timer {
    player: DPlayer;
    types: ('loading' | 'info' | 'fps')[];
    enablefpsChecker: boolean;
    enableinfoChecker: boolean;
    enableloadingChecker: boolean;
    fpsIndex: number;
    fpsStart: Date | number;
    fpsChecker: number;
    infoChecker: number;
    loadingChecker: number;
    constructor(player: DPlayer);
    init(): void;
    initloadingChecker(): void;
    initfpsChecker(): void;
    initinfoChecker(): void;
    enable(type: 'loading' | 'info' | 'fps'): void;
    disable(type: 'loading' | 'info' | 'fps'): void;
    destroy(): void;
}
export default Timer;
//# sourceMappingURL=timer.d.ts.map