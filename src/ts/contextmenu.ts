import DPlayer from './player';

class ContextMenu {
    contextmenuHandler: (e: MouseEvent) => void;
    player: DPlayer;
    shown: boolean;

    constructor(player: DPlayer) {
        this.player = player;
        this.shown = false;

        Array.prototype.slice.call(this.player.template.menuItem).forEach((item, index) => {
            if (this.player.options.contextmenu[index].click) {
                item.addEventListener('click', () => {
                    const contextmenu = this.player.options.contextmenu[index];
                    if (contextmenu.click) contextmenu.click(this.player);
                    this.hide();
                });
            }
        });

        this.contextmenuHandler = (e: MouseEvent) => {
            const event = e || window.event;
            event.preventDefault();

            if (this.shown) {
                this.hide();
                return;
            }

            const clientRect = this.player.container.getBoundingClientRect();
            this.show(event.clientX - clientRect.left, event.clientY - clientRect.top);

            this.player.template.mask.addEventListener('click', () => {
                this.hide();
            });
        };
        this.player.container.addEventListener('contextmenu', this.contextmenuHandler);
    }

    show(x: number, y: number): void {
        this.player.template.menu.classList.add('dplayer-menu-show');

        const clientRect = this.player.container.getBoundingClientRect();
        if (x + this.player.template.menu.offsetWidth >= clientRect.width) {
            this.player.template.menu.style.right = clientRect.width - x + 'px';
            this.player.template.menu.style.left = 'initial';
        } else {
            this.player.template.menu.style.left = x + 'px';
            this.player.template.menu.style.right = 'initial';
        }
        if (y + this.player.template.menu.offsetHeight >= clientRect.height) {
            this.player.template.menu.style.bottom = clientRect.height - y + 'px';
            this.player.template.menu.style.top = 'initial';
        } else {
            this.player.template.menu.style.top = y + 'px';
            this.player.template.menu.style.bottom = 'initial';
        }

        this.player.template.mask.classList.add('dplayer-mask-show');

        this.shown = true;
        this.player.events.trigger('contextmenu_show');
    }

    hide(): void {
        this.player.template.mask.classList.remove('dplayer-mask-show');
        this.player.template.menu.classList.remove('dplayer-menu-show');

        this.shown = false;
        this.player.events.trigger('contextmenu_hide');
    }

    destroy(): void {
        this.player.container.removeEventListener('contextmenu', this.contextmenuHandler);
    }
}

export default ContextMenu;
