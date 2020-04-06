import utils from './utils';

class FullScreen {
    constructor(player) {
        this.player = player;
        this.lastScrollPosition = { left: 0, top: 0 };
        this.player.events.on('webfullscreen', () => {
            this.player.resize();
        });
        this.player.events.on('webfullscreen_cancel', () => {
            this.player.resize();
            utils.setScrollPosition(this.lastScrollPosition);
        });

        const fullscreenchange = () => {
            this.player.resize();
            if (this.isFullScreen('browser')) {
                this.player.events.trigger('fullscreen');
            } else {
                utils.setScrollPosition(this.lastScrollPosition);
                this.player.events.trigger('fullscreen_cancel');
            }
        };
        const docfullscreenchange = () => {
            const fullEle = document.fullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
            if (fullEle && fullEle !== this.player.container) {
                return;
            }
            this.player.resize();
            if (fullEle) {
                this.player.events.trigger('fullscreen');
            } else {
                utils.setScrollPosition(this.lastScrollPosition);
                this.player.events.trigger('fullscreen_cancel');
            }
        };
        if (/Firefox/.test(navigator.userAgent)) {
            document.addEventListener('mozfullscreenchange', docfullscreenchange);
            document.addEventListener('fullscreenchange', docfullscreenchange);
        } else {
            this.player.container.addEventListener('fullscreenchange', fullscreenchange);
            this.player.container.addEventListener('webkitfullscreenchange', fullscreenchange);
            document.addEventListener('msfullscreenchange', docfullscreenchange);
            document.addEventListener('MSFullscreenChange', docfullscreenchange);
        }
    }

    isFullScreen(type = 'browser') {
        switch (type) {
            case 'browser':
                return document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
            case 'web':
                return this.player.container.classList.contains('dplayer-fulled');
        }
    }

    request(type = 'browser') {
        const anotherType = type === 'browser' ? 'web' : 'browser';
        const anotherTypeOn = this.isFullScreen(anotherType);
        if (!anotherTypeOn) {
            this.lastScrollPosition = utils.getScrollPosition();
        }

        switch (type) {
            case 'browser':
                if (this.player.container.requestFullscreen) {
                    this.player.container.requestFullscreen();
                } else if (this.player.container.mozRequestFullScreen) {
                    this.player.container.mozRequestFullScreen();
                } else if (this.player.container.webkitRequestFullscreen) {
                    this.player.container.webkitRequestFullscreen();
                } else if (this.player.video.webkitEnterFullscreen) {
                    this.player.video.webkitEnterFullscreen(); // Safari for iOS
                } else if (this.player.container.msRequestFullscreen) {
                    this.player.container.msRequestFullscreen();
                }
                // Lock the screen landscape
                screen.orientation.lock('landscape').catch(function() {});
                this.player.container.classList.add('dplayer-fulled-browser');
                break;
            case 'web':
                this.player.container.classList.add('dplayer-fulled');
                document.body.classList.add('dplayer-web-fullscreen-fix');
                this.player.events.trigger('webfullscreen');
                break;
        }

        if (anotherTypeOn) {
            this.cancel(anotherType);
        }
    }

    cancel(type = 'browser') {
        switch (type) {
            case 'browser':
                if (document.cancelFullScreen) {
                    document.cancelFullScreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (document.msCancelFullScreen) {
                    document.msCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
                try {
                    // Unlock the screen
                    screen.orientation.unlock();
                } catch (e) {
                    // Error (underfined)
                }
                this.player.container.classList.remove('dplayer-fulled-browser');
                break;
            case 'web':
                this.player.container.classList.remove('dplayer-fulled');
                document.body.classList.remove('dplayer-web-fullscreen-fix');
                this.player.events.trigger('webfullscreen_cancel');
                break;
        }
    }

    toggle(type = 'browser') {
        if (this.isFullScreen(type)) {
            this.cancel(type);
        } else {
            this.request(type);
        }
    }
}

export default FullScreen;
