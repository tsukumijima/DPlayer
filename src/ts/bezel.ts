class Bezel {
    container: any;
    constructor(container: any) {
        this.container = container;

        this.container.addEventListener('animationend', () => {
            this.container.classList.remove('dplayer-bezel-transition');
        });
    }

    switch(icon: any) {
        this.container.innerHTML = icon;
        this.container.classList.add('dplayer-bezel-transition');
    }
}

export default Bezel;
