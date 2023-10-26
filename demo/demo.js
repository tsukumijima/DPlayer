// stats.js: JavaScript Performance Monitor
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
function animate() {
    stats.begin();
    // monitored code goes here
    stats.end();

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

initPlayers();
handleEvent();

function handleEvent() {
    document.getElementById('dplayer-dialog').addEventListener('click', (e) => {
        const $clickDom = e.currentTarget;
        const isShowStatus = $clickDom.getAttribute('data-show');

        if (isShowStatus) {
            document.getElementById('float-dplayer').style.display = 'none';
        } else {
            $clickDom.setAttribute('data-show', 1);
            document.getElementById('float-dplayer').style.display = 'block';
        }
    });

    document.getElementById('close-dialog').addEventListener('click', () => {
        const $openDialogBtnDom = document.getElementById('dplayer-dialog');

        $openDialogBtnDom.setAttribute('data-show', '');
        document.getElementById('float-dplayer').style.display = 'none';
    });
}

function initPlayers() {

    // ===== for KonomiTV =====

    // デフォルト値
    if (localStorage.getItem('api_base_url') === null) {
        localStorage.setItem('api_base_url', 'https://192-168-1-47.local.konomi.tv:7000/api');
    }
    if (localStorage.getItem('display_channel_id') === null) {
        localStorage.setItem('display_channel_id', 'gr011');
    }
    if (localStorage.getItem('tv_streaming_quality') === null) {
        localStorage.setItem('tv_streaming_quality', '1080p-60fps');
    }
    if (localStorage.getItem('is_radiochannel') === null) {
        localStorage.setItem('is_radiochannel', 'false');
    }
    if (localStorage.getItem('is_mpegts_supported') === null) {
        localStorage.setItem('is_mpegts_supported', 'true');
    }
    if (localStorage.getItem('tv_low_latency_mode') === null) {
        localStorage.setItem('tv_low_latency_mode', 'true');
    }
    if (localStorage.getItem('tv_data_saver_mode') === null) {
        localStorage.setItem('tv_data_saver_mode', 'false');
    }

    const api_base_url = localStorage.getItem('api_base_url');
    document.querySelector('#api_base_url').value = api_base_url;
    const display_channel_id = localStorage.getItem('display_channel_id');
    document.querySelector('#display_channel_id').value = display_channel_id;
    const tv_streaming_quality = localStorage.getItem('tv_streaming_quality');
    document.querySelector('#tv_streaming_quality').value = tv_streaming_quality;
    const is_radiochannel = localStorage.getItem('is_radiochannel') === 'true';
    document.querySelector('#is_radiochannel').checked = is_radiochannel;
    const tv_data_saver_mode = localStorage.getItem('tv_data_saver_mode') === 'true';
    document.querySelector('#tv_data_saver_mode').checked = tv_data_saver_mode;
    const is_mpegts_supported = localStorage.getItem('is_mpegts_supported') === 'true';
    document.querySelector('#is_mpegts_supported').checked = is_mpegts_supported;
    const tv_low_latency_mode = localStorage.getItem('tv_low_latency_mode') === 'true';
    document.querySelector('#tv_low_latency_mode').checked = tv_low_latency_mode;

    // 低遅延モードオン時の再生バッファ (秒単位)
    // 0.8 秒程度余裕を持たせる
    const LIVE_PLAYBACK_BUFFER_SECONDS_LOW_LATENCY = 0.8;

    // 低遅延モードオフ時の再生バッファ (秒単位)
    // 5秒程度の遅延を許容する
    const LIVE_PLAYBACK_BUFFER_SECONDS = 5.0;

    // 低遅延モードであれば低遅延向けの再生バッファを、そうでなければ通常の再生バッファをセット (秒単位)
    const playback_buffer_seconds = tv_low_latency_mode ?
        LIVE_PLAYBACK_BUFFER_SECONDS_LOW_LATENCY : LIVE_PLAYBACK_BUFFER_SECONDS;

    // DPlayer を初期化
    window.KonomiTVDPlayer = new DPlayer({
        // DPlayer を配置する要素
        container: document.getElementById('dplayer0'),
        // テーマカラー
        theme: '#E64F97',
        // 言語 (日本語固定)
        lang: 'ja-jp',
        // ライブモード (ビデオ視聴では無効)
        live: true,
        // ライブモードで同期する際の最小バッファサイズ
        liveSyncMinBufferSize: is_mpegts_supported ? playback_buffer_seconds - 0.1 : 0,
        // ループ再生 (ライブ視聴では無効)
        loop: false,
        // 自動再生
        autoplay: true,
        // AirPlay 機能 (うまく動かないため無効化)
        airplay: false,
        // ショートカットキー（こちらで制御するため無効化）
        hotkey: false,
        // スクリーンショット (こちらで制御するため無効化)
        screenshot: false,
        // CORS を有効化
        crossOrigin: 'anonymous',
        // 音量の初期値
        volume: 1.0,

        // 動画の設定
        video: {
            // デフォルトの品質
            // ラジオチャンネルでは常に 48KHz/192kbps に固定する
            defaultQuality: (is_radiochannel) ?
            '48kHz/192kbps' : tv_streaming_quality,
            // 品質リスト
            quality: (() => {
                const qualities = [];

                // ラジオチャンネル
                // API が受け付ける品質の値は通常のチャンネルと同じだが (手抜き…)、実際の品質は 48KHz/192kbps で固定される
                // ラジオチャンネルの場合は、1080p と渡しても 48kHz/192kbps 固定の音声だけの MPEG-TS が配信される
                if (is_radiochannel) {
                    // mpegts.js
                    if (is_mpegts_supported === true) {
                        qualities.push({
                            name: '48kHz/192kbps',
                            type: 'mpegts',
                            url: `${api_base_url}/streams/live/bs531/1080p/mpegts`,
                        });
                    // LL-HLS (mpegts.js がサポートされていない場合)
                    } else {
                        qualities.push({
                            name: '48kHz/192kbps',
                            type: 'live-llhls-for-KonomiTV',
                            url: `${api_base_url}/streams/live/bs531/1080p/ll-hls`,
                        });
                    }

                // 通常のチャンネル
                } else {

                    // ブラウザが H.265 / HEVC の再生に対応していて、かつ通信節約モードが有効なとき
                    // API に渡す画質に -hevc のプレフィックスをつける
                    let hevc_prefix = '';
                    if (tv_data_saver_mode === true) {
                        hevc_prefix = '-hevc';
                    }

                    // 品質リストを作成
                    for (const quality of ['1080p-60fps', '1080p', '810p', '720p', '540p', '480p', '360p', '240p']) {
                        // mpegts.js
                        if (is_mpegts_supported === true) {
                            qualities.push({
                                name: quality === '1080p-60fps' ? '1080p (60fps)' : quality,
                                type: 'mpegts',
                                url: `${api_base_url}/streams/live/${display_channel_id}/${quality}${hevc_prefix}/mpegts`,
                            });
                        // LL-HLS (mpegts.js がサポートされていない場合)
                        } else {
                            qualities.push({
                                name: quality === '1080p-60fps' ? '1080p (60fps)' : quality,
                                type: 'live-llhls-for-KonomiTV',
                                url: `${api_base_url}/streams/live/${display_channel_id}/${quality}${hevc_prefix}/ll-hls`,
                            });
                        }
                    }
                }
                return qualities;
            })(),
        },

        // コメントの設定
        danmaku: {
            // コメントするユーザー名: 便宜上 KonomiTV に固定 (実際には利用されない)
            user: 'KonomiTV',
            // コメントの流れる速度
            speedRate: 1.0,
            // コメントのフォントサイズ
            fontSize: 35,
            // コメント送信後にコメントフォームを閉じるかどうか
            closeCommentFormAfterSend: true,
        },

        // コメント API バックエンドの設定
        apiBackend: {
            // コメント取得時
            read: (options) => {
                // 空の配列を返す (こうするとコメント0件と認識される)
                options.success([]);
            },
            // コメント送信時
            send: async (options) => {
                // とりあえず成功としておく
                window.setTimeout(() => options.success(), 500);  // 500ms 後に成功とする
            },
        },

        // 字幕の設定
        subtitle: {
            type: 'aribb24',  // aribb24.js を有効化
        },

        // 再生プラグインの設定
        pluginOptions: {
            // mpegts.js
            mpegts: {
                config: {
                    // Web Worker を有効にする
                    enableWorker: true,
                    // Media Source Extensions API 向けの Web Worker を有効にする
                    // メインスレッドから再生処理を分離することで、低スペック端末で DOM 描画の遅延が影響して映像再生が詰まる問題が解消される
                    // MSE in Workers が使えるかは MediaSource.canConstructInDedicatedWorker が true かどうかで判定できる
                    // ref: https://developer.mozilla.org/en-US/docs/Web/API/MediaSource/canConstructInDedicatedWorker_static
                    enableWorkerForMSE: window.MediaSource && window.MediaSource.canConstructInDedicatedWorker === true,
                    // IO 層のバッファを禁止する
                    enableStashBuffer: false,
                    // HTMLMediaElement の内部バッファによるライブストリームの遅延を追跡する
                    // liveBufferLatencyChasing と異なり、いきなり再生時間をスキップするのではなく、
                    // 再生速度を少しだけ上げることで再生を途切れさせることなく遅延を追跡する
                    liveSync: tv_low_latency_mode,
                    // 許容する HTMLMediaElement の内部バッファの最大値 (秒単位, 3秒)
                    liveSyncMaxLatency: 3,
                    // HTMLMediaElement の内部バッファ (遅延) が liveSyncMaxLatency を超えたとき、ターゲットとする遅延時間 (秒単位)
                    liveSyncTargetLatency: playback_buffer_seconds,
                    // ライブストリームの遅延の追跡に利用する再生速度 (x1.1)
                    // 遅延が 3 秒を超えたとき、遅延が playback_buffer_sec を下回るまで再生速度が x1.1 に設定される
                    liveSyncPlaybackRate: 1.1,
                }
            },
            // aribb24.js
            aribb24: {
                // 文字スーパーを有効にする
                disableSuperimposeRenderer: false,
                // 描画フォント
                normalFont: `"Windows TV MaruGothic", "Rounded M+ 1m for ARIB", sans-serif`,
                // 縁取りする色
                forceStrokeColor: true,
                // 背景色
                forceBackgroundColor: (() => {
                    return undefined;
                })(),
                // DRCS 文字を対応する Unicode 文字に置換
                drcsReplacement: true,
                // 高解像度の字幕 Canvas を取得できるように
                enableRawCanvas: true,
                // 縁取りに strokeText API を利用
                useStroke: true,
                // Unicode 領域の代わりに私用面の領域を利用 (Windows TV 系フォントのみ)
                usePUA: (() => {
                    const font = 'Windows TV MaruGothic';
                    const context = document.createElement('canvas').getContext('2d');
                    context.font = '10px "Rounded M+ 1m for ARIB"';
                    context.fillText('Test', 0, 0);
                    context.font = `10px "${font}"`;
                    context.fillText('Test', 0, 0);
                    if (font.startsWith('Windows TV')) {
                        return true;
                    } else {
                        return false;
                    }
                })(),
            }
        }
    });
    window.addEventListener('beforeunload', () => {
        window.KonomiTVDPlayer.destroy();
    });

    // ====================

    // dplayer-float
    window.dpFloat = new DPlayer({
        container: document.getElementById('dplayer-container'),
        preload: 'none',
        screenshot: true,
        video: {
            url: 'http://static.smartisanos.cn/common/video/t1-ui.mp4',
            pic: 'http://static.smartisanos.cn/pr/img/video/video_03_cc87ce5bdb.jpg',
            thumbnails: 'http://static.smartisanos.cn/pr/img/video/video_03_cc87ce5bdb.jpg'
        },
        subtitle: {
            url: 'subtitle test'
        },
        danmaku: {
            id: '9E2E3368B56CDBB4',
            api: 'https://api.prprpr.me/dplayer/'
        }
    });

    // dp1
    window.dp1 = new DPlayer({
        container: document.getElementById('dplayer1'),
        preload: 'none',
        screenshot: true,
        video: {
            url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png',
            thumbnails: 'https://i.loli.net/2019/06/06/5cf8c5d9cec8510758.jpg'
        },
        subtitle: {
            url: 'https://s-sh-17-dplayercdn.oss.dogecdn.com/hikarunara.vtt'
        },
        danmaku: {
            id: '9E2E3368B56CDBB4',
            api: 'https://api.prprpr.me/dplayer/',
            addition: ['https://s-sh-17-dplayercdn.oss.dogecdn.com/1678963.json']
        }
    });

    // dp2
    window.dp2 = new DPlayer({
        container: document.getElementById('dplayer2'),
        preload: 'none',
        autoplay: false,
        theme: '#FADFA3',
        loop: true,
        screenshot: true,
        airplay: true,
        hotkey: true,
        logo: 'https://i.loli.net/2019/06/06/5cf8c5d94521136430.png',
        volume: 0.2,
        mutex: true,
        video: {
            quality: [{
                name: 'HD',
                url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            }, {
                name: 'SD',
                url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            }],
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png',
            thumbnails: 'https://i.loli.net/2019/06/06/5cf8c5d9cec8510758.jpg',
            type: 'auto'
        },
        subtitle: {
            url: 'https://s-sh-17-dplayercdn.oss.dogecdn.com/hikarunara.vtt',
            type: 'webvtt',
            fontSize: '25px',
            bottom: '10%',
            color: '#b7daff'
        },
        danmaku: {
            id: '9E2E3368B56CDBB4',
            api: 'https://api.prprpr.me/dplayer/',
            token: 'tokendemo',
            maximum: 3000,
            user: 'DIYgod',
            bottom: '15%',
            unlimited: true
        },
        contextmenu: [
            {
                text: 'custom contextmenu',
                link: 'https://github.com/MoePlayer/DPlayer'
            }
        ]
    });

    const events = [
        'abort', 'canplay', 'canplaythrough', 'durationchange', 'emptied', 'ended', 'error',
        'loadeddata', 'loadedmetadata', 'loadstart', 'mozaudioavailable', 'pause', 'play',
        'playing', 'ratechange', 'seeked', 'seeking', 'stalled',
        'volumechange', 'waiting',
        'screenshot',
        'thumbnails_show', 'thumbnails_hide',
        'danmaku_show', 'danmaku_hide', 'danmaku_clear',
        'danmaku_load_start', 'danmaku_load_end', 'danmaku_send', 'danmaku_opacity',
        'contextmenu_show', 'contextmenu_hide',
        'notice_show', 'notice_hide',
        'quality_start', 'quality_end',
        'destroy',
        'resize',
        'fullscreen', 'fullscreen_cancel', 'webfullscreen', 'webfullscreen_cancel',
        'subtitle_show', 'subtitle_hide', 'subtitle_change'
    ];
    const eventsEle = document.getElementById('events');
    for (let i = 0; i < events.length; i++) {
        dp2.on(events[i], (info) => {
            eventsEle.innerHTML += '<p>Event: ' + events[i] + '</p>';
            eventsEle.scrollTop = eventsEle.scrollHeight;
        });
    }

    // dp3
    window.dp3 = new DPlayer({
        container: document.getElementById('dplayer3'),
        preload: 'none',
        video: {
            quality: [{
                name: 'HD',
                url: 'https://test-streams.mux.dev/x36xhzz/url_8/193039199_mp4_h264_aac_fhd_7.m3u8',
                type: 'hls'
            }, {
                name: 'SD',
                url: 'https://test-streams.mux.dev/x36xhzz/url_4/193039199_mp4_h264_aac_7.m3u8',
                type: 'hls'
            }],
            defaultQuality: 0,
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png'
        }
    });

    // dp4
    window.dp4 = new DPlayer({
        container: document.getElementById('dplayer4'),
        preload: 'none',
        video: {
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            type: 'hls'
        }
    });

    // dp5
    window.dp5 = new DPlayer({
        container: document.getElementById('dplayer5'),
        preload: 'none',
        video: {
            url: 'http://docs.evostream.com/sample_content/assets/bun33s.flv',
            type: 'flv'
        }
    });

    window.dp8 = new DPlayer({
        container: document.getElementById('dplayer8'),
        preload: 'none',
        video: {
            url: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd',
            type: 'dash'
        }
    });

    // window.dp9 = new DPlayer({
    //     container: document.getElementById('dplayer9'),
    //     video: {
    //         url: 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent',
    //         type: 'webtorrent'
    //     }
    // });

    window.dp6 = new DPlayer({
        container: document.getElementById('dplayer6'),
        preload: 'none',
        live: true,
        danmaku: true,
        apiBackend: {
            read: function (options) {
                console.log('假装 WebSocket 连接成功');
                options.success([]);
            },
            send: function (options) {
                console.log('假装通过 WebSocket 发送数据', options.data);
                options.success();
            }
        },
        video: {
            url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            type: 'hls'
        }
    });

    // window.dp10 = new DPlayer({
    //     container: document.getElementById('dplayer10'),
    //     video: {
    //         url: 'https://qq.webrtc.win/tv/Pear-Demo-Yosemite_National_Park.mp4',
    //         type: 'pearplayer',
    //         customType: {
    //             'pearplayer': function (video, player) {
    //                 new PearPlayer(video, {
    //                     src: video.src,
    //                     autoplay: player.options.autoplay
    //                 });
    //             }
    //         }
    //     }
    // });
}

function clearPlayers() {
    for (let i = 0; i < 6; i++) {
        window['dp' + (i + 1)].pause();
        document.getElementById('dplayer' + (i + 1)).innerHTML = '';
    }
}

function switchDPlayer() {
    if (dp2.option.danmaku.id !== '5rGf5Y2X55qu6Z2p') {
        dp2.switchVideo({
            url: 'http://static.smartisanos.cn/common/video/t1-ui.mp4',
            pic: 'http://static.smartisanos.cn/pr/img/video/video_03_cc87ce5bdb.jpg',
            type: 'auto',
        }, {
            id: '5rGf5Y2X55qu6Z2p',
            api: 'https://api.prprpr.me/dplayer/',
            maximum: 3000,
            user: 'DIYgod'
        });
    } else {
        dp2.switchVideo({
            url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
            pic: 'https://i.loli.net/2019/06/06/5cf8c5d9c57b510947.png',
            thumbnails: 'https://i.loli.net/2019/06/06/5cf8c5d9cec8510758.jpg',
            type: 'auto'
        }, {
            id: '9E2E3368B56CDBB42',
            api: 'https://api.prprpr.me/dplayer/',
            maximum: 3000,
            user: 'DIYgod'
        });
    }
}
