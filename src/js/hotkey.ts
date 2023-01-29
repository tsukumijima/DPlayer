class HotKey {
    constructor(player) {
        this.player = player;
        this.doHotKeyHandler = this.doHotKey.bind(this);
        this.cancelFullScreenHandler = this.cancelFullScreen.bind(this);
        if (this.player.options.hotkey) {
            document.addEventListener('keydown', this.doHotKeyHandler);
        }
        document.addEventListener('keydown', this.cancelFullScreenHandler);
    }

    doHotKey(e) {
        const tag = document.activeElement.tagName.toUpperCase();
        const editable = document.activeElement.getAttribute('contenteditable');
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && editable !== '' && editable !== 'true') {
            const event = e || window.event;
            let percentage;
            switch (event.keyCode) {
                case 32:
                    if (this.player.focus || this.player.options.hotkey) {
                        event.preventDefault();
                        this.player.toggle();
                    }
                    break;
                case 37:
                    if (this.player.focus || this.player.options.hotkey) {
                        event.preventDefault();
                        if (event.altKey) {
                            this.player.seek(this.player.video.currentTime - 60);
                        } else if (event.shiftKey) {
                            this.player.seek(this.player.video.currentTime - 30);
                        } else if (event.ctrlKey || event.metaKey) {
                            this.player.seek(this.player.video.currentTime - 15);
                        } else {
                            this.player.seek(this.player.video.currentTime - 5);
                        }
                        this.player.controller.setAutoHide();
                    }
                    break;
                case 39:
                    if (this.player.focus || this.player.options.hotkey) {
                        event.preventDefault();
                        if (event.altKey) {
                            this.player.seek(this.player.video.currentTime + 60);
                        } else if (event.shiftKey) {
                            this.player.seek(this.player.video.currentTime + 30);
                        } else if (event.ctrlKey || event.metaKey) {
                            this.player.seek(this.player.video.currentTime + 15);
                        } else {
                            this.player.seek(this.player.video.currentTime + 5);
                        }
                        this.player.controller.setAutoHide();
                    }
                    break;
                case 38:
                    if (this.player.focus) {
                        event.preventDefault();
                        percentage = this.player.volume() + 0.1;
                        this.player.volume(percentage);
                    }
                    break;
                case 40:
                    if (this.player.focus) {
                        event.preventDefault();
                        percentage = this.player.volume() - 0.1;
                        this.player.volume(percentage);
                    }
                    break;
                case 70: // F
                    if (!event.ctrlKey && !event.metaKey) {
                        event.preventDefault();
                        this.player.fullScreen.toggle('browser');
                    }
                    break;
                case 87: // W
                    if (!event.ctrlKey && !event.metaKey) {
                        event.preventDefault();
                        this.player.fullScreen.toggle('web');
                    }
                    break;
                case 76: // L
                    if (this.player.options.live) {
                        event.preventDefault();
                        this.player.sync();
                    }
                    break;
                case 80: // P
                    if (this.player.options.pictureInPicture) {
                        if (document.pictureInPictureEnabled) {
                            event.preventDefault();
                            this.player.template.pipButton.click();
                        }
                    }
                    break;
                case 67: // C
                    if (typeof this.player.options.danmaku === 'object' && this.player.options.danmaku) {
                        if (!event.ctrlKey && !event.metaKey) {
                            event.preventDefault();
                            this.player.controller.show();
                            this.player.comment.show();
                        }
                    }
                    break;
                case 68: // D
                    if (typeof this.player.options.danmaku === 'object' && this.player.options.danmaku) {
                        if (!event.ctrlKey && !event.metaKey) {
                            event.preventDefault();
                            this.player.template.showDanmaku.click();
                            if (this.player.template.showDanmakuToggle.checked) {
                                this.player.notice(`${this.player.tran('Show comment')}`);
                            } else {
                                this.player.notice(`${this.player.tran('Hide comment')}`);
                            }
                        }
                    }
                    break;
                case 83: // S
                    if (this.player.options.subtitle) {
                        if (!event.ctrlKey && !event.metaKey) {
                            event.preventDefault();
                            if (this.player.subtitle.container.classList.contains('dplayer-subtitle-hide')) {
                                this.player.notice(`${this.player.tran('Show subtitle')}`);
                            } else {
                                this.player.notice(`${this.player.tran('Hide subtitle')}`);
                            }
                            this.player.subtitle.toggle();
                        }
                    }
                    break;
            }
        }
    }

    cancelFullScreen(e) {
        const event = e || window.event;
        switch (event.keyCode) {
            case 27:
                if (this.player.fullScreen.isFullScreen('web')) {
                    this.player.fullScreen.cancel('web');
                }
                break;
        }
    }

    destroy() {
        if (this.player.options.hotkey) {
            document.removeEventListener('keydown', this.doHotKeyHandler);
        }
        document.removeEventListener('keydown', this.cancelFullScreenHandler);
    }
}

export default HotKey;
