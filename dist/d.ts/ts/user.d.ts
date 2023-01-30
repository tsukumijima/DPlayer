import DPlayer from './player';
declare class User {
    storageName: {
        [key: string]: string;
    };
    default: {
        [key: string]: number;
    };
    data: {
        [key: string]: number;
    };
    constructor(player: DPlayer);
    init(): void;
    get(key: 'opacity' | 'volume' | 'unlimited' | 'danmaku' | 'subtitle'): number;
    set(key: 'opacity' | 'volume' | 'unlimited' | 'danmaku' | 'subtitle', value: number): void;
}
export default User;
//# sourceMappingURL=user.d.ts.map