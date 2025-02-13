import DPlayer from './player';
import utils from './utils';
import Thumbnails from './thumbnails';
import Icons from './icons';

class Controller {
    player: DPlayer;
    disableAutoHide = false;
    autoHideTimer: number;
    mobileSkipTimer: number;
    mobileBackwardTime: number;
    mobileForwardTime: number;
    setAutoHideHandler: () => void;
    thumbnails: Thumbnails | null = null;

    constructor(player: DPlayer) {
        this.player = player;

        this.autoHideTimer = 0;
        this.mobileSkipTimer = 0;
        this.mobileBackwardTime = 0;
        this.mobileForwardTime = 0;
        this.setAutoHideHandler = () => this.setAutoHide();
        if (!utils.isMobile) {
            this.player.container.addEventListener('mousemove', this.setAutoHideHandler);
            this.player.container.addEventListener('click', this.setAutoHideHandler);
        } else {
            this.player.container.addEventListener('touchmove', this.setAutoHideHandler);
        }
        this.player.on('play', this.setAutoHideHandler);
        this.player.on('pause', this.setAutoHideHandler);

        this.initPlayButton();
        this.initThumbnails();
        this.initPlayedBar();
        this.initFullButton();
        this.initPipButton();
        this.initSyncButton();
        this.initScreenshotButton();
        this.initSubtitleButton();
        this.initHighlights();
        this.initAirplayButton();
        if (!utils.isMobile) {
            this.initVolumeButton();
        }
    }

    initPlayButton(): void {
        this.player.template.playButton.addEventListener('click', () => {
            this.player.toggle();
        });

        this.player.template.mobilePlayButton.addEventListener('click', () => {
            this.player.toggle();
        });

        if (!utils.isMobile) {
            this.player.template.videoWrap.addEventListener('click', () => {
                this.player.toggle();
            });
            this.player.template.controllerMask.addEventListener('click', () => {
                this.player.toggle();
            });
        } else {
            this.player.template.videoWrap.addEventListener('click', () => {
                this.toggle();
                if (this.isShow()) {
                    this.setAutoHide();
                }
            });
            this.player.template.controllerMask.addEventListener('click', () => {
                this.toggle();
                if (this.isShow()) {
                    this.setAutoHide();
                }
            });
        }

        // REW 10s
        this.player.template.mobileBackwardButton.addEventListener('click', () => {
            this.mobileBackwardTime += 10;
            this.player.seek(this.player.video.currentTime - 10);
            if (this.player.options.lang.includes('ja')) {
                this.player.notice(`${this.mobileBackwardTime.toFixed(0)}秒早戻し`);
            } else {
                this.player.notice(`${this.player.tran('REW')} ${this.mobileBackwardTime.toFixed(0)} ${this.player.tran('s')}`);
            }
            // extend count reset
            // if the REW button is not pressed within 1 second, the count will be reset automatically
            window.clearTimeout(this.mobileSkipTimer);
            this.mobileSkipTimer = window.setTimeout(() => {
                this.mobileBackwardTime = 0;
            }, 1000);
            this.setAutoHide();
        });

        // FF 10s
        this.player.template.mobileForwardButton.addEventListener('click', () => {
            this.mobileForwardTime += 10;
            this.player.seek(this.player.video.currentTime + 10);
            if (this.player.options.lang.includes('ja')) {
                this.player.notice(`${this.mobileForwardTime.toFixed(0)}秒早送り`);
            } else {
                this.player.notice(`${this.player.tran('FF')} ${this.mobileForwardTime.toFixed(0)} ${this.player.tran('s')}`);
            }
            // extend count reset
            // if the FF button is not pressed within 1 second, the count will be reset automatically
            window.clearTimeout(this.mobileSkipTimer);
            this.mobileSkipTimer = window.setTimeout(() => {
                this.mobileForwardTime = 0;
            }, 1000);
            this.setAutoHide();
        });
    }

    initHighlights(): void {
        this.player.on('durationchange', () => {
            if (this.player.video.duration !== 1 && this.player.video.duration !== Infinity) {
                if (this.player.options.highlight) {
                    const highlights = this.player.template.playedBarWrap.querySelectorAll('.dplayer-highlight');
                    [].slice.call(highlights, 0).forEach((item) => {
                        this.player.template.playedBarWrap.removeChild(item);
                    });
                    for (let i = 0; i < this.player.options.highlight.length; i++) {
                        if (!this.player.options.highlight[i].text || !this.player.options.highlight[i].time) {
                            continue;
                        }
                        const p = document.createElement('div');
                        p.classList.add('dplayer-highlight');
                        p.style.left = (this.player.options.highlight[i].time / this.player.video.duration) * 100 + '%';
                        const span = document.createElement('span');
                        span.classList.add('dplayer-highlight-text');
                        span.textContent = this.player.options.highlight[i].text;
                        p.appendChild(span);
                        this.player.template.playedBarWrap.insertBefore(p, this.player.template.playedBarTime);
                    }
                }
            }
        });
    }

    initThumbnails(): void {
        if (this.player.options.video.thumbnails) {
            const thumbnailsConfig = this.player.options.video.thumbnails;
            this.thumbnails = new Thumbnails({
                player: this.player,
                url: thumbnailsConfig.url,
                events: this.player.events,
                interval: thumbnailsConfig.interval,
                totalCount: thumbnailsConfig.totalCount,
                width: thumbnailsConfig.width,
                height: thumbnailsConfig.height,
                columnCount: thumbnailsConfig.columnCount,
            });

            this.player.on('loadedmetadata', () => {
                const width = thumbnailsConfig.width || 160;
                const height = thumbnailsConfig.height || Math.floor(width * 9 / 16);
                this.thumbnails!.resize(
                    width,
                    height,
                    this.player.template.barWrap.offsetWidth,
                );
            });
        }
    }

    initPlayedBar(): void {
        let paused: boolean;

        const thumbMove = (e: Event) => {
            const event = e as TouchEvent | MouseEvent;
            e.preventDefault();
            let percentage = utils.getRelativeX(event, this.player.template.playedBarWrap) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.player.bar.set('played', percentage, 'width');
            const duration = utils.getVideoDuration(this.player.video, this.player.template);
            this.player.template.ptime.textContent = utils.secondToTime(percentage * duration);
            this.player.container.classList.add('dplayer-seeking');
            if (!this.player.video.paused) {
                this.player.video.pause();
            }
        };

        const thumbUp = (e: Event) => {
            const event = e as TouchEvent | MouseEvent;
            document.removeEventListener(utils.nameMap.dragEnd, thumbUp);
            document.removeEventListener(utils.nameMap.dragMove, thumbMove);
            // fallback for Document Picture-in-Picture window
            this.player.container.removeEventListener(utils.nameMap.dragEnd, thumbUp);
            this.player.container.removeEventListener(utils.nameMap.dragMove, thumbMove);
            let percentage = utils.getRelativeX(event, this.player.template.playedBarWrap) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.player.bar.set('played', percentage, 'width');
            const duration = utils.getVideoDuration(this.player.video, this.player.template);
            this.player.seek(this.player.bar.get('played') * duration, true);  // hide notice
            if (!paused) {
                this.player.video.play();
            }
            this.player.container.classList.remove('dplayer-seeking');
        };

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragStart, (e: Event) => {
            e.preventDefault();
            paused = this.player.video.paused;
            document.addEventListener(utils.nameMap.dragMove, thumbMove, { passive: false });
            document.addEventListener(utils.nameMap.dragEnd, thumbUp);
            // fallback for Document Picture-in-Picture window
            this.player.container.addEventListener(utils.nameMap.dragMove, thumbMove, { passive: false });
            this.player.container.addEventListener(utils.nameMap.dragEnd, thumbUp);
        }, { passive: false });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragMove, (e: Event) => {
            e.preventDefault();
            const event = e as TouchEvent | MouseEvent;
            const duration = utils.getVideoDuration(this.player.video, this.player.template);
            if (duration) {
                const relativeX = utils.getRelativeX(event, this.player.template.playedBarWrap);
                if (relativeX < 0 || relativeX > this.player.template.playedBarWrap.offsetWidth) {
                    return;
                }
                const time = duration * (relativeX / this.player.template.playedBarWrap.offsetWidth);
                if (utils.isMobile) {
                    this.thumbnails && this.thumbnails.show();
                }
                this.thumbnails && this.thumbnails.move(relativeX);
                this.player.template.playedBarTime.style.left = `${relativeX - (time >= 3600 ? 27.5 : 22.5)}px`;
                this.player.template.playedBarTime.textContent = utils.secondToTime(time);
                this.player.template.playedBarTime.classList.remove('hidden');
            }
        }, { passive: false });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragEnd, () => {
            if (utils.isMobile) {
                this.thumbnails && this.thumbnails.hide();
            }
        });

        if (!utils.isMobile) {
            this.player.template.playedBarWrap.addEventListener('mouseenter', () => {
                if (this.player.video.duration) {
                    this.thumbnails && this.thumbnails.show();
                    this.player.template.playedBarTime.classList.remove('hidden');
                }
            });

            this.player.template.playedBarWrap.addEventListener('mouseleave', () => {
                if (this.player.video.duration) {
                    this.thumbnails && this.thumbnails.hide();
                    this.player.template.playedBarTime.classList.add('hidden');
                }
            });
        }
    }

    initFullButton(): void {
        this.player.template.browserFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('browser');
        });

        this.player.template.webFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('web');
        });
    }

    initPipButton(): void {
        if (document.pictureInPictureEnabled) {
            this.player.template.pipButton.addEventListener('click', () => {
                if (!document.pictureInPictureElement) {
                    this.player.video.requestPictureInPicture().catch((reason) => {
                        console.error(reason);
                        if (this.player.options.lang.includes('ja')) {
                            this.player.notice('Picture-in-Picture を開始できませんでした。', undefined, undefined, '#FF6F6A');
                        } else {
                            this.player.notice('Picture-in-Picture could not be started.', undefined, undefined, '#FF6F6A');
                        }
                    });
                } else {
                    document.exitPictureInPicture();
                }
            });
        } else {
            this.player.template.pipButton.style.display = 'none';
        }
    }

    initVolumeButton(): void {
        const vWidth = 35;

        const volumeMove = (event: Event) => {
            const e = event as TouchEvent | MouseEvent;
            const percentage = (utils.getRelativeX(e, this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        };
        const volumeUp = () => {
            document.removeEventListener(utils.nameMap.dragEnd, volumeUp);
            document.removeEventListener(utils.nameMap.dragMove, volumeMove);
            // fallback for Document Picture-in-Picture window
            this.player.container.removeEventListener(utils.nameMap.dragEnd, volumeUp);
            this.player.container.removeEventListener(utils.nameMap.dragMove, volumeMove);
            this.player.template.volumeButton.classList.remove('dplayer-volume-active');
        };

        this.player.template.volumeBarWrapWrap.addEventListener('click', (event: Event) => {
            const e = event as TouchEvent | MouseEvent;
            const percentage = (utils.getRelativeX(e, this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        });
        this.player.template.volumeBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
            document.addEventListener(utils.nameMap.dragMove, volumeMove);
            document.addEventListener(utils.nameMap.dragEnd, volumeUp);
            // fallback for Document Picture-in-Picture window
            this.player.container.addEventListener(utils.nameMap.dragMove, volumeMove);
            this.player.container.addEventListener(utils.nameMap.dragEnd, volumeUp);
            this.player.template.volumeButton.classList.add('dplayer-volume-active');
        });
        this.player.template.volumeButtonIcon.addEventListener('click', () => {
            if (this.player.video.muted) {
                this.player.video.muted = false;
                this.player.switchVolumeIcon();
                this.player.bar.set('volume', this.player.volume(), 'width');
            } else {
                this.player.video.muted = true;
                this.player.template.volumeIcon.innerHTML = Icons.volumeOff;
                this.player.bar.set('volume', 0, 'width');
            }
        });
    }

    initSyncButton(): void {
        if (this.player.options.live) {
            this.player.template.syncButton.addEventListener('click', () => {
                this.player.sync();
            });
        }
    }

    initScreenshotButton(): void {
        if (this.player.options.screenshot) {
            this.player.template.cameraButton.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.player.video.videoWidth;
                canvas.height = this.player.video.videoHeight;
                canvas.getContext('2d')!.drawImage(this.player.video, 0, 0, canvas.width, canvas.height);

                canvas.toBlob((blob) => {
                    if (blob === null) return;

                    // generate download filename
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = ('0' + (today.getMonth() + 1)).slice(-2);
                    const day = ('0' + today.getDate()).slice(-2);
                    const hour = ('0' + today.getHours()).slice(-2);
                    const min = ('0' + today.getMinutes()).slice(-2);
                    const sec = ('0' + today.getSeconds()).slice(-2);
                    const filename = `Capture_${year}${month}${day}-${hour}${min}${sec}.jpg`;

                    // download screenshot
                    const bloburl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    if (typeof link.download === 'undefined') {
                        this.player.notice('Error: Screenshot download is not supported.', undefined, undefined, '#FF6F6A');
                        return;
                    }
                    link.download = filename;
                    link.href = bloburl;
                    link.click();
                    URL.revokeObjectURL(bloburl);

                    this.player.events.trigger('screenshot', blob);

                // specify image type and quality
                }, 'image/jpeg', 1);
            });
        }
    }

    initAirplayButton(): void {
        if (this.player.options.airplay) {
            if (window.WebKitPlaybackTargetAvailabilityEvent) {
                this.player.video.addEventListener(
                    'webkitplaybacktargetavailabilitychanged',
                    function(this: DPlayer, event: WebKitPlaybackTargetAvailabilityEvent) {
                        switch (event.availability) {
                            case 'available':
                                // @ts-ignore
                                this.template.airplayButton.disable = false;
                                break;

                            default:
                                // @ts-ignore
                                this.template.airplayButton.disable = true;
                        }

                        this.template.airplayButton.addEventListener(
                            'click',
                            function(this: DPlayer) {
                                this.video.webkitShowPlaybackTargetPicker();
                            }.bind(this),
                        );
                    }.bind(this.player),
                );
            } else {
                this.player.template.airplayButton.style.display = 'none';
            }
        }
    }

    initSubtitleButton(): void {
        if (this.player.options.subtitle) {
            this.player.events.on('subtitle_show', () => {
                this.player.template.subtitleButton.ariaLabel = this.player.tran('Hide subtitle');
                this.player.template.subtitleButtonInner.style.opacity = '';
                this.player.user.set('subtitle', 1);
            });
            this.player.events.on('subtitle_hide', () => {
                this.player.template.subtitleButton.ariaLabel = this.player.tran('Show subtitle');
                this.player.template.subtitleButtonInner.style.opacity = '0.4';
                this.player.user.set('subtitle', 0);
            });

            this.player.template.subtitleButton.addEventListener('click', () => {
                if (this.player.subtitle !== null) {
                    this.player.subtitle.toggle();
                }
            });
        }
    }

    setAutoHide(time = 3000): void {
        this.show();
        window.clearTimeout(this.autoHideTimer);
        this.autoHideTimer = window.setTimeout(() => {
            if (this.player.video.played.length && !this.player.paused && !this.disableAutoHide) {
                this.hide();
            }
        }, time);
    }

    show(): void {
        this.player.container.classList.remove('dplayer-hide-controller');
    }

    hide() : void{
        this.player.container.classList.add('dplayer-hide-controller');
        this.player.setting.hide();
        this.player.comment && this.player.comment.hide();
    }

    isShow(): boolean {
        return !this.player.container.classList.contains('dplayer-hide-controller');
    }

    toggle(): void {
        if (this.isShow()) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy(): void {
        if (!utils.isMobile) {
            this.player.container.removeEventListener('mousemove', this.setAutoHideHandler);
            this.player.container.removeEventListener('click', this.setAutoHideHandler);
        } else {
            this.player.container.removeEventListener('touchmove', this.setAutoHideHandler);
        }
        window.clearTimeout(this.autoHideTimer);
    }
}

export default Controller;
