class Timer {
    enablefpsChecker: any;
    enableinfoChecker: any;
    enableloadingChecker: any;
    fpsIndex: any;
    fpsStart: any;
    infoChecker: any;
    loadingChecker: any;
    player: any;
    types: any;
    constructor(player: any) {
        this.player = player;

        window.requestAnimationFrame = (() =>
            window.requestAnimationFrame ||
            // @ts-expect-error TS(2339): Property 'webkitRequestAnimationFrame' does not ex... Remove this comment to see the full error message
            window.webkitRequestAnimationFrame ||
            // @ts-expect-error TS(2339): Property 'mozRequestAnimationFrame' does not exist... Remove this comment to see the full error message
            window.mozRequestAnimationFrame ||
            // @ts-expect-error TS(2551): Property 'oRequestAnimationFrame' does not exist o... Remove this comment to see the full error message
            window.oRequestAnimationFrame ||
            // @ts-expect-error TS(2551): Property 'msRequestAnimationFrame' does not exist ... Remove this comment to see the full error message
            window.msRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 1000 / 60);
            })();

        this.types = ['loading', 'info', 'fps'];

        this.init();
    }

    init() {
        this.types.map((item: any) => {
            if (item !== 'fps') {
                // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
                this[`init${item}Checker`]();
            }
            return item;
        });
    }

    initloadingChecker() {
        let lastPlayPos = 0;
        let currentPlayPos = 0;
        let bufferingDetected = false;
        this.loadingChecker = setInterval(() => {
            if (this.enableloadingChecker) {
                // whether the video is buffering
                currentPlayPos = this.player.video.currentTime;
                if (!bufferingDetected && currentPlayPos === lastPlayPos && !this.player.video.paused) {
                    this.player.container.classList.add('dplayer-loading');
                    bufferingDetected = true;
                }
                if (bufferingDetected && currentPlayPos > lastPlayPos && !this.player.video.paused) {
                    this.player.container.classList.remove('dplayer-loading');
                    bufferingDetected = false;
                }
                lastPlayPos = currentPlayPos;
            }
        }, 100);
    }

    initfpsChecker() {
        window.requestAnimationFrame(() => {
            if (this.enablefpsChecker) {
                this.initfpsChecker();
                if (!this.fpsStart) {
                    this.fpsStart = new Date();
                    this.fpsIndex = 0;
                } else {
                    this.fpsIndex++;
                    const fpsCurrent = new Date();
                    // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
                    if (fpsCurrent - this.fpsStart > 1000) {
                        // @ts-expect-error TS(2362): The left-hand side of an arithmetic operation must... Remove this comment to see the full error message
                        this.player.infoPanel.fps((this.fpsIndex / (fpsCurrent - this.fpsStart)) * 1000);
                        this.fpsStart = new Date();
                        this.fpsIndex = 0;
                    }
                }
            } else {
                this.fpsStart = 0;
                this.fpsIndex = 0;
            }
        });
    }

    initinfoChecker() {
        this.infoChecker = setInterval(() => {
            if (this.enableinfoChecker) {
                this.player.infoPanel.update();
            }
        }, 1000);
    }

    enable(type: any) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        this[`enable${type}Checker`] = true;

        if (type === 'fps') {
            this.initfpsChecker();
        }
    }

    disable(type: any) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        this[`enable${type}Checker`] = false;
    }

    destroy() {
        this.types.map((item: any) => {
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            this[`enable${item}Checker`] = false;
            // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
            this[`${item}Checker`] && clearInterval(this[`${item}Checker`]);
            return item;
        });
    }
}

export default Timer;
