import DPlayer from './player';
import utils from './utils';
import * as DPlayerType from './types';

declare let window: DPlayerType.WindowExtend;

class Setting {
    player: DPlayer;
    loop: boolean;
    showDanmaku: boolean;
    unlimitDanmaku: boolean;
    currentAudio: DPlayerType.AudioChannel = 'primary';
    resizeObserver: ResizeObserver;

    constructor(player: DPlayer) {
        this.player = player;

        this.player.template.mask.addEventListener('click', () => {
            this.hide();
        });
        this.player.template.settingButton.addEventListener('click', () => {
            this.show();
        });

        // clip setting box
        const clipSettingBox = () => {
            const settingOriginPanelHeight = this.player.template.settingOriginPanel.scrollHeight;
            this.player.template.settingBox.style.clipPath = `inset(calc(100% - ${settingOriginPanelHeight}px) 0 0 round 7px)`;
        };
        clipSettingBox();
        this.resizeObserver = new ResizeObserver(clipSettingBox);
        this.resizeObserver.observe(this.player.template.settingOriginPanel);

        // quality
        if (this.player.options.video.quality) {
            this.player.template.quality.addEventListener('click', () => {
                this.player.template.settingBox.classList.add('dplayer-setting-box-quality');
            });
            this.player.template.qualityHeader.addEventListener('click', () => {
                this.player.template.settingBox.classList.remove('dplayer-setting-box-quality');
            });
            for (let i = 0; i < this.player.template.qualityItem.length; i++) {
                this.player.template.qualityItem[i].addEventListener('click', () => {
                    // currently switching
                    if (this.player.switchingQuality) {
                        return;
                    }
                    this.player.switchQuality(parseInt(this.player.template.qualityItem[i].dataset.index!));
                });
            }
        }

        // speed
        this.player.template.speed.addEventListener('click', () => {
            this.player.template.settingBox.classList.add('dplayer-setting-box-speed');
        });
        this.player.template.speedHeader.addEventListener('click', () => {
            this.player.template.settingBox.classList.remove('dplayer-setting-box-speed');
        });
        for (let i = 0; i < this.player.template.speedItem.length; i++) {
            this.player.template.speedItem[i].addEventListener('click', (event: any) => {
                this.player.speed(parseFloat(event.target.dataset.speed));
            });
        }

        // audio
        this.player.template.audio.addEventListener('click', () => {
            this.player.template.settingBox.classList.add('dplayer-setting-box-audio');
        });
        this.player.template.audioHeader.addEventListener('click', () => {
            this.player.template.settingBox.classList.remove('dplayer-setting-box-audio');
        });
        for (let i = 0; i < this.player.template.audioItem.length; i++) {
            this.player.template.audioItem[i].addEventListener('click', () => {
                const audio = this.player.template.audioItem[i].dataset.audio as DPlayerType.AudioChannel;

                // A click on the selected item has no backend state to change
                if (audio === this.currentAudio) {
                    this.player.template.settingBox.classList.remove('dplayer-setting-box-audio');
                    return;
                }

                // Keep the settings panel open when the active backend cannot offer the requested channel
                if (this.player.switchAudio(audio)) {
                    this.player.template.settingBox.classList.remove('dplayer-setting-box-audio');
                }
            });
        }

        // loop
        this.loop = this.player.user.get('loop') === 1;
        this.player.template.loopToggle.checked = this.loop;
        this.player.template.loop.addEventListener('click', () => {
            this.player.template.loopToggle.checked = !this.player.template.loopToggle.checked;
            if (this.player.template.loopToggle.checked) {
                this.loop = true;
            } else {
                this.loop = false;
            }
            this.player.user.set('loop', this.loop ? 1 : 0);
        });

        // show danmaku
        this.showDanmaku = this.player.user.get('danmaku') === 1;
        if (!this.showDanmaku) {
            this.player.danmaku && this.player.danmaku.hide();
        }
        this.player.template.showDanmakuToggle.checked = this.showDanmaku;
        this.player.template.showDanmaku.addEventListener('click', () => {
            this.player.template.showDanmakuToggle.checked = !this.player.template.showDanmakuToggle.checked;
            if (this.player.template.showDanmakuToggle.checked) {
                this.showDanmaku = true;
                if (this.player.danmaku !== null) {
                    this.player.danmaku.show();
                }
            } else {
                this.showDanmaku = false;
                if (this.player.danmaku !== null) {
                    this.player.danmaku.hide();
                }
            }
            this.player.user.set('danmaku', this.showDanmaku ? 1 : 0);
        });

        // unlimit danmaku
        this.unlimitDanmaku = this.player.user.get('unlimited') === 1;
        this.player.template.unlimitDanmakuToggle.checked = this.unlimitDanmaku;
        this.player.template.unlimitDanmaku.addEventListener('click', () => {
            this.player.template.unlimitDanmakuToggle.checked = !this.player.template.unlimitDanmakuToggle.checked;
            if (this.player.template.unlimitDanmakuToggle.checked) {
                this.unlimitDanmaku = true;
                if (this.player.danmaku !== null) {
                    this.player.danmaku.unlimit(true);
                }
            } else {
                this.unlimitDanmaku = false;
                if (this.player.danmaku !== null) {
                    this.player.danmaku.unlimit(false);
                }
            }
            this.player.user.set('unlimited', this.unlimitDanmaku ? 1 : 0);
        });

        // danmaku opacity
        if (this.player.danmaku) {
            this.player.on('danmaku_opacity', (percentage: number) => {
                this.player.bar.set('danmaku', percentage, 'width');
                this.player.user.set('opacity', percentage);
                this.player.template.danmakuOpacityValue.textContent = percentage.toFixed(1);
            });
            this.player.danmaku.opacity(this.player.user.get('opacity'));
            this.player.template.danmakuOpacityValue.textContent = this.player.user.get('opacity').toFixed(1);

            const danmakuMove = (event: Event) => {
                const e = event as PointerEvent | TouchEvent | MouseEvent;
                const barWidth = this.player.template.danmakuOpacityBarWrap.clientWidth;
                let percentage = utils.getRelativeX(e, this.player.template.danmakuOpacityBarWrap) / barWidth;
                percentage = Math.max(percentage, 0);
                percentage = Math.min(percentage, 1);
                if (this.player.danmaku !== null) {
                    this.player.danmaku.opacity(percentage);
                }
            };
            const danmakuUp = () => {
                document.removeEventListener(utils.nameMap.dragEnd, danmakuUp);
                document.removeEventListener(utils.nameMap.dragMove, danmakuMove);
                // fallback for Document Picture-in-Picture window
                this.player.container.removeEventListener(utils.nameMap.dragEnd, danmakuUp);
                this.player.container.removeEventListener(utils.nameMap.dragMove, danmakuMove);
                this.player.template.danmakuOpacityBox.classList.remove('dplayer-setting-danmaku-active');
            };

            this.player.template.danmakuOpacityBarWrapWrap.addEventListener('click', (event: Event) => {
                const e = event as PointerEvent | TouchEvent | MouseEvent;
                const barWidth = this.player.template.danmakuOpacityBarWrap.clientWidth;
                let percentage = utils.getRelativeX(e, this.player.template.danmakuOpacityBarWrap) / barWidth;
                percentage = Math.max(percentage, 0);
                percentage = Math.min(percentage, 1);
                if (this.player.danmaku !== null) {
                    this.player.danmaku.opacity(percentage);
                }
            });
            this.player.template.danmakuOpacityBarWrapWrap.addEventListener(utils.nameMap.dragStart, () => {
                document.addEventListener(utils.nameMap.dragMove, danmakuMove);
                document.addEventListener(utils.nameMap.dragEnd, danmakuUp);
                // fallback for Document Picture-in-Picture window
                this.player.container.addEventListener(utils.nameMap.dragMove, danmakuMove);
                this.player.container.addEventListener(utils.nameMap.dragEnd, danmakuUp);
                this.player.template.danmakuOpacityBox.classList.add('dplayer-setting-danmaku-active');
            });
        }
    }

    /**
     * Reflect the selected broadcast audio channel in the settings UI
     * @param audio Selected audio channel
     */
    setCurrentAudio(audio: DPlayerType.AudioChannel): void {
        const isSecondaryAudio = audio === 'secondary';
        this.currentAudio = audio;
        this.player.template.audioItem[0].classList.toggle('dplayer-setting-audio-current', !isSecondaryAudio);
        this.player.template.audioItem[1].classList.toggle('dplayer-setting-audio-current', isSecondaryAudio);
        this.player.template.audioValue.textContent = isSecondaryAudio ?
            this.player.tran('Secondary audio') : this.player.tran('Primary audio');
    }

    hide(): void {
        this.player.template.container.classList.remove('dplayer-show-controller');
        this.player.template.settingBox.classList.remove('dplayer-setting-box-open');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        window.setTimeout(() => {
            this.player.template.settingBox.classList.remove('dplayer-setting-box-speed');
            this.player.template.settingBox.classList.remove('dplayer-setting-box-audio');
        }, 300);

        this.player.controller.disableAutoHide = false;
    }

    show(): void {
        this.player.template.container.classList.add('dplayer-show-controller');
        this.player.template.settingBox.classList.add('dplayer-setting-box-open');
        this.player.template.mask.classList.add('dplayer-mask-show');

        this.player.controller.disableAutoHide = true;
    }

    destroy(): void {
        this.resizeObserver.disconnect();
    }
}

export default Setting;
