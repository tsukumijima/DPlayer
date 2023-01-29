class Bezel {
    container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;

        this.container.addEventListener('animationend', () => {
            this.container.classList.remove('dplayer-bezel-transition');
        });
    }

    switch(icon: string): void {
        this.container.innerHTML = icon;
        this.container.classList.add('dplayer-bezel-transition');
    }
}

export default Bezel;
