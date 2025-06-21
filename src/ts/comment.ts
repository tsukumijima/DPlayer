import DPlayer from './player';
import * as DPlayerType from './types';

class Comment {
    player: DPlayer;

    constructor(player: DPlayer) {
        this.player = player;

        this.player.template.mask.addEventListener('click', () => {
            this.hide();
        });
        this.player.template.commentButton.addEventListener('click', () => {
            this.show();
        });
        this.player.template.commentSettingButton.addEventListener('click', () => {
            this.toggleSetting();
        });

        this.player.template.commentColorSettingBox.addEventListener('click', () => {
            const spanElem = this.player.template.commentColorSettingBox.querySelector('input:checked+span');
            if (spanElem) {
                const color = this.player.template.commentColorSettingBox.querySelector<HTMLInputElement>('input:checked')!.value;
                this.player.template.commentSettingFill.style.fill = color;
                this.player.template.commentInput.style.color = color;
                this.player.template.commentSendFill.style.fill = color;
            }
        });

        this.player.template.commentInput.addEventListener('click', () => {
            this.hideSetting();
        });
        this.player.template.commentInput.addEventListener('keydown', (e) => {
            const event = e || window.event;
            if (event.keyCode === 13) {
                this.send();
            }
        });

        this.player.template.commentSendButton.addEventListener('click', () => {
            this.send();
        });
    }

    show(): void {
        this.player.controller.disableAutoHide = true;
        this.player.template.controller.classList.add('dplayer-controller-comment');
        this.player.template.mask.classList.add('dplayer-mask-show');
        this.player.container.classList.add('dplayer-show-controller');
        this.player.template.commentInput.focus();
    }

    hide(): void {
        this.player.template.controller.classList.remove('dplayer-controller-comment');
        this.player.template.mask.classList.remove('dplayer-mask-show');
        this.player.container.classList.remove('dplayer-show-controller');
        this.player.controller.disableAutoHide = false;
        this.hideSetting();
    }

    showSetting(): void {
        this.player.template.commentSettingBox.classList.add('dplayer-comment-setting-open');
    }

    hideSetting(): void {
        this.player.template.commentSettingBox.classList.remove('dplayer-comment-setting-open');
    }

    toggleSetting(): void {
        if (this.player.template.commentSettingBox.classList.contains('dplayer-comment-setting-open')) {
            this.hideSetting();
        } else {
            this.showSetting();
        }
    }

    send(): void {

        // remove focus from comment input form
        if (this.player.options.danmaku?.closeCommentFormAfterSend === true) {
            this.player.template.commentInput.blur();
        }

        // text can't be empty
        if (!this.player.template.commentInput.value.replace(/^\s+|\s+$/g, '')) {
            this.player.notice(this.player.tran('Please input danmaku content'), undefined, undefined, '#FF6F6A');
            return;
        }

        if (this.player.danmaku !== null) {
            this.player.danmaku.send(
                {
                    text: this.player.template.commentInput.value,
                    color: this.player.container.querySelector<HTMLInputElement>('.dplayer-comment-setting-color input:checked')!.value,
                    type: this.player.container.querySelector<HTMLInputElement>('.dplayer-comment-setting-type input:checked')!.value as DPlayerType.DanmakuType,
                    size: this.player.container.querySelector<HTMLInputElement>('.dplayer-comment-setting-size input:checked')!.value as DPlayerType.DanmakuSize,
                },
                () => {
                    if (this.player.options.danmaku?.closeCommentFormAfterSend === true) {
                        this.hide();
                        this.player.controller.setAutoHide(750);
                    }
                },
                true,
            );
        }

        // prevent double send
        this.player.template.commentInput.value = '';
    }
}

export default Comment;
