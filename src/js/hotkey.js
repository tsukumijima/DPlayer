class HotKey {
    constructor(player) {
        if (player.options.hotkey) {
            document.addEventListener('keydown', (e) => {
                const tag = document.activeElement.tagName.toUpperCase();
                const editable = document.activeElement.getAttribute('contenteditable');
                if (tag !== 'INPUT' && tag !== 'TEXTAREA' && editable !== '' && editable !== 'true') {
                    const event = e || window.event;
                    let percentage;
                    switch (event.keyCode) {
                        case 32:
                            if (player.focus || player.options.hotkey) {
                                event.preventDefault();
                                player.toggle();
                            }
                            break;
                        case 37:
                            if (player.focus || player.options.hotkey) {
                                event.preventDefault();
                                if (event.altKey) {
                                    player.seek(player.video.currentTime - 60);
                                } else if (event.shiftKey) {
                                    player.seek(player.video.currentTime - 30);
                                } else if (event.ctrlKey || event.metaKey) {
                                    player.seek(player.video.currentTime - 15);
                                } else {
                                    player.seek(player.video.currentTime - 5);
                                }
                                player.controller.setAutoHide();
                            }
                            break;
                        case 39:
                            if (player.focus || player.options.hotkey) {
                                event.preventDefault();
                                if (event.altKey) {
                                    player.seek(player.video.currentTime + 60);
                                } else if (event.shiftKey) {
                                    player.seek(player.video.currentTime + 30);
                                } else if (event.ctrlKey || event.metaKey) {
                                    player.seek(player.video.currentTime + 15);
                                } else {
                                    player.seek(player.video.currentTime + 5);
                                }
                                player.controller.setAutoHide();
                            }
                            break;
                        case 38:
                            if (player.focus) {
                                event.preventDefault();
                                percentage = player.volume() + 0.1;
                                player.volume(percentage);
                            }
                            break;
                        case 40:
                            if (player.focus) {
                                event.preventDefault();
                                percentage = player.volume() - 0.1;
                                player.volume(percentage);
                            }
                            break;
                        case 70: // F
                            if (!event.ctrlKey && !event.metaKey) {
                                event.preventDefault();
                                player.fullScreen.toggle('browser');
                            }
                            break;
                        case 87: // W
                            if (!event.ctrlKey && !event.metaKey) {
                                event.preventDefault();
                                player.fullScreen.toggle('web');
                            }
                            break;
                        case 76: // L
                            if (player.options.live) {
                                event.preventDefault();
                                player.sync();
                            }
                            break;
                        case 80: // P
                            if (player.options.pictureInPicture) {
                                if (document.pictureInPictureEnabled) {
                                    event.preventDefault();
                                    player.template.pipButton.click();
                                }
                            }
                            break;
                        case 67: // C
                            if (typeof player.options.danmaku === 'object' && player.options.danmaku) {
                                if (!event.ctrlKey && !event.metaKey) {
                                    event.preventDefault();
                                    player.comment.show();
                                }
                            }
                            break;
                        case 68: // D
                            if (typeof player.options.danmaku === 'object' && player.options.danmaku) {
                                if (!event.ctrlKey && !event.metaKey) {
                                    event.preventDefault();
                                    player.template.showDanmaku.click();
                                    if (player.template.showDanmakuToggle.checked) {
                                        player.notice(`${player.tran('Show comment')}`);
                                    } else {
                                        player.notice(`${player.tran('Hide comment')}`);
                                    }
                                }
                            }
                            break;
                        case 83: // S
                            if (player.options.subtitle) {
                                if (!event.ctrlKey && !event.metaKey) {
                                    event.preventDefault();
                                    if (player.subtitle.container.classList.contains('dplayer-subtitle-hide')) {
                                        player.notice(`${player.tran('Show subtitle')}`);
                                    } else {
                                        player.notice(`${player.tran('Hide subtitle')}`);
                                    }
                                    player.subtitle.toggle();
                                }
                            }
                            break;
                    }
                }
            });
        }

        document.addEventListener('keydown', (e) => {
            const event = e || window.event;
            switch (event.keyCode) {
                case 27:
                    if (player.fullScreen.isFullScreen('web')) {
                        player.fullScreen.cancel('web');
                    }
                    break;
            }
        });
    }
}

export default HotKey;
