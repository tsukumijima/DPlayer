import utils from './utils';
import Thumbnails from './thumbnails';
import Icons from './icons';

class Controller {
    constructor(player) {
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

    initPlayButton() {
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
            this.player.notice(`${this.player.tran('REW')} ${this.mobileBackwardTime.toFixed(0)} ${this.player.tran('s')}`);
            // extend count reset
            // if the REW button is not pressed within 1 second, the count will be reset automatically
            clearTimeout(this.mobileSkipTimer);
            this.mobileSkipTimer = setTimeout(() => {
                this.mobileBackwardTime = 0;
            }, 1000);
            this.setAutoHide();
        });

        // FF 10s
        this.player.template.mobileForwardButton.addEventListener('click', () => {
            this.mobileForwardTime += 10;
            this.player.seek(this.player.video.currentTime + 10);
            this.player.notice(`${this.player.tran('FF')} ${this.mobileForwardTime.toFixed(0)} ${this.player.tran('s')}`);
            // extend count reset
            // if the FF button is not pressed within 1 second, the count will be reset automatically
            clearTimeout(this.mobileSkipTimer);
            this.mobileSkipTimer = setTimeout(() => {
                this.mobileForwardTime = 0;
            }, 1000);
            this.setAutoHide();
        });
    }

    initHighlights() {
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
                        p.innerHTML = '<span class="dplayer-highlight-text">' + this.player.options.highlight[i].text + '</span>';
                        this.player.template.playedBarWrap.insertBefore(p, this.player.template.playedBarTime);
                    }
                }
            }
        });
    }

    initThumbnails() {
        if (this.player.options.video.thumbnails) {
            this.thumbnails = new Thumbnails({
                container: this.player.template.barPreview,
                barWidth: this.player.template.barWrap.offsetWidth,
                url: this.player.options.video.thumbnails,
                events: this.player.events,
            });

            this.player.on('loadedmetadata', () => {
                this.thumbnails.resize(160, (this.player.video.videoHeight / this.player.video.videoWidth) * 160, this.player.template.barWrap.offsetWidth);
            });
        }
    }

    initPlayedBar() {
        let paused;

        const thumbMove = (e) => {
            let percentage = ((e.clientX || (e.changedTouches && e.changedTouches[0].clientX)) - utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.player.bar.set('played', percentage, 'width');
            const duration = utils.getVideoDuration(this.player.video, this.player.template);
            this.player.template.ptime.innerHTML = utils.secondToTime(percentage * duration);
            this.player.container.classList.add('dplayer-seeking');
            if (!this.player.video.paused) {
                this.player.video.pause();
            }
        };

        const thumbUp = (e) => {
            document.removeEventListener(utils.nameMap.dragEnd, thumbUp);
            document.removeEventListener(utils.nameMap.dragMove, thumbMove);
            let percentage = ((e.clientX || (e.changedTouches && e.changedTouches[0].clientX)) - utils.getBoundingClientRectViewLeft(this.player.template.playedBarWrap)) / this.player.template.playedBarWrap.clientWidth;
            percentage = Math.max(percentage, 0);
            percentage = Math.min(percentage, 1);
            this.player.bar.set('played', percentage, 'width');
            const duration = utils.getVideoDuration(this.player.video, this.player.template);
            this.player.seek(this.player.bar.get('played') * duration);
            this.player.timer.enable('progress');
            if (!paused) {
                this.player.video.play();
            }
            this.player.container.classList.remove('dplayer-seeking');
        };

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragStart, () => {
            this.player.timer.disable('progress');
            paused = this.player.video.paused;
            document.addEventListener(utils.nameMap.dragMove, thumbMove);
            document.addEventListener(utils.nameMap.dragEnd, thumbUp);
        });

        this.player.template.playedBarWrap.addEventListener(utils.nameMap.dragMove, (e) => {
            const duration = utils.getVideoDuration(this.player.video, this.player.template);
            if (duration) {
                const px = this.player.template.playedBarWrap.getBoundingClientRect().left;
                const tx = (e.clientX || e.changedTouches[0].clientX) - px;
                if (tx < 0 || tx > this.player.template.playedBarWrap.offsetWidth) {
                    return;
                }
                const time = duration * (tx / this.player.template.playedBarWrap.offsetWidth);
                if (utils.isMobile) {
                    this.thumbnails && this.thumbnails.show();
                }
                this.thumbnails && this.thumbnails.move(tx);
                this.player.template.playedBarTime.style.left = `${tx - (time >= 3600 ? 25 : 20)}px`;
                this.player.template.playedBarTime.innerText = utils.secondToTime(time);
                this.player.template.playedBarTime.classList.remove('hidden');
            }
        });

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

    initFullButton() {
        this.player.template.browserFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('browser');
        });

        this.player.template.webFullButton.addEventListener('click', () => {
            this.player.fullScreen.toggle('web');
        });
    }

    initPipButton() {
        if (document.pictureInPictureEnabled) {
            this.player.template.pipButton.addEventListener('click', () => {
                if (!document.pictureInPictureElement) {
                    this.player.video.requestPictureInPicture().catch(() => {
                        this.player.notice('Error: Picture-in-Picture is not supported.');
                    });
                } else {
                    document.exitPictureInPicture();
                }
            });
        } else {
            this.player.template.pipButton.style.display = 'none';
        }
    }

    initVolumeButton() {
        const vWidth = 35;

        const volumeMove = (event) => {
            const e = event || window.event;
            const percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        };
        const volumeUp = () => {
            document.removeEventListener(utils.nameMap.dragEnd, volumeUp);
            document.removeEventListener(utils.nameMap.dragMove, volumeMove);
            this.player.template.volumeButton.classList.remove('dplayer-volume-active');
        };

        this.player.template.volumeBarWrapWrap.addEventListener('click', (event) => {
            const e = event || window.event;
            const percentage = ((e.clientX || e.changedTouches[0].clientX) - utils.getBoundingClientRectViewLeft(this.player.template.volumeBarWrap) - 5.5) / vWidth;
            this.player.volume(percentage);
        });
        this.player.template.volumeBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
            document.addEventListener(utils.nameMap.dragMove, volumeMove);
            document.addEventListener(utils.nameMap.dragEnd, volumeUp);
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

    initSyncButton() {
        if (this.player.options.live) {
            this.player.template.syncButton.addEventListener('click', () => {
                this.player.sync();
            });
        }
    }

    initScreenshotButton() {
        if (this.player.options.screenshot) {
            this.player.template.cameraButton.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.player.video.videoWidth;
                canvas.height = this.player.video.videoHeight;
                canvas.getContext('2d').drawImage(this.player.video, 0, 0, canvas.width, canvas.height);

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
                        this.player.notice('Error: Screenshot download is not supported.');
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

    initAirplayButton() {
        if (this.player.options.airplay) {
            if (window.WebKitPlaybackTargetAvailabilityEvent) {
                this.player.video.addEventListener(
                    'webkitplaybacktargetavailabilitychanged',
                    function (event) {
                        switch (event.availability) {
                            case 'available':
                                this.template.airplayButton.disable = false;
                                break;

                            default:
                                this.template.airplayButton.disable = true;
                        }

                        this.template.airplayButton.addEventListener(
                            'click',
                            function () {
                                this.video.webkitShowPlaybackTargetPicker();
                            }.bind(this)
                        );
                    }.bind(this.player)
                );
            } else {
                this.player.template.airplayButton.style.display = 'none';
            }
        }
    }

    initSubtitleButton() {
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
                this.player.subtitle.toggle();
            });
        }
    }

    setAutoHide(time = 3000) {
        this.show();
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = setTimeout(() => {
            if (this.player.video.played.length && !this.player.paused && !this.disableAutoHide) {
                this.hide();
            }
        }, time);
    }

    show() {
        this.player.container.classList.remove('dplayer-hide-controller');
    }

    hide() {
        this.player.container.classList.add('dplayer-hide-controller');
        this.player.setting.hide();
        this.player.comment && this.player.comment.hide();
    }

    isShow() {
        return !this.player.container.classList.contains('dplayer-hide-controller');
    }

    toggle() {
        if (this.isShow()) {
            this.hide();
        } else {
            this.show();
        }
    }

    destroy() {
        if (!utils.isMobile) {
            this.player.container.removeEventListener('mousemove', this.setAutoHideHandler);
            this.player.container.removeEventListener('click', this.setAutoHideHandler);
        } else {
            this.player.container.removeEventListener('touchmove', this.setAutoHideHandler);
        }
        clearTimeout(this.autoHideTimer);
    }
}

export default Controller;