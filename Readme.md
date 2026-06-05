<p align="center">
<img src="https://i.imgur.com/LnPvZvO.png" alt="ADPlayer" width="100">
</p>
<h1 align="center">DPlayer</h1>

> 🍭 Wow, such a lovely HTML5 danmaku video player

この Fork は、

- **ソースコードを TypeScript へ移行 & TypeScript サポートの追加**
- 日本語対応の追加
- 全体的な UI の見直しとブラッシュアップ
- Danmaku（コメント）描画周りの大幅な修正
- Danmaku（コメント）のサイズ変更 (big, medium, small) に対応
- スマホ・タブレットや日本語対応により崩れる CSS の修正
- スマホ・タブレット向け UI の最適化と改善
- スマホ・タブレット向けの早送り・早戻しボタンの追加
- 早送り・早戻し周りの不具合の修正
- Live 再生時の同期ボタンの追加
- Picture-in-Picture (PiP) ボタンの追加
- キーボードショートカット（ホットキー）の追加
- スクリーンショット保存時のファイル名の変更
- スクリーンショット機能をスマホ・タブレットでも使えるように変更
- 設定パネルの UI を丸みを帯びたデザインに刷新
- 設定パネルで現在の設定値を確認できるように変更
- 画質の切り替え UI を設定パネルに統合
- 再生速度の切り替え UI のデザインを刷新
- mpegts.js 利用時に主音声と副音声を切り替えられる機能を追加し、設定パネルに統合
- mpegts.js を利用した低遅延ライブストリーミングのサポートを追加
- aribb24.js を利用した ARIB 字幕・文字スーパーのサポートを追加
- 依存パッケージを大幅に更新
  - Webpack 5 へのアップグレードのほか、node-sass を sass (dart-sass) に移行した
- パッケージ管理を npm から yarn に移行
  - 依存パッケージの更新にともない、npm だと依存関係が解決できないことがあったため
- そのほか多数の不具合修正と改善

と、[KonomiTV](https://github.com/tsukumijima/KonomiTV)・[TVRemotePlus](https://github.com/tsukumijima/TVRemotePlus) 向けに多くの不具合改善と大幅な変更・改善を行った DPlayer です。

> なお、Fork 元からオプションや動作仕様がいくつか追加・変更されています (この Fork 内のドキュメントは更新されていないため注意) 。  
> 詳しい仕様は TypeScript の型定義内のコメントを参照してください。

おそらく、ニコニコ風のコメントを流せるプレイヤーの中では一番多機能なのではないでしょうか。  
ぜひ日本でももっと広まって欲しいと思っています（コメントを流さない場合でも軽量で優秀なプレイヤーだと思います）。  
KonomiTV や TVRemotePlus 向けではありますが、できるだけ汎用的に改造しているつもりです。そのまま他の用途でも使えるかもしれません。

### Installation

今のところ npm には公開していませんが、その代わりに dist/ 以下を Git 管理に含め、リリース時に毎回ビルド済みファイルの更新とタグ付けを行っています。

以下のように GitHub のリポジトリ名を package.json に記述すれば、本家 DPlayer の代わりとして利用できます。

```json
{
    "name": "example-project",
    "dependencies": {
        "dplayer": "github:tsukumijima/DPlayer#v1.32.8"
    }
}
```

---

<p align="center">
<img src="https://i.imgur.com/LnPvZvO.png" alt="ADPlayer" width="100">
</p>
<h1 align="center">DPlayer</h1>

> 🍭 Wow, such a lovely HTML5 danmaku video player

[![npm](https://img.shields.io/npm/v/dplayer.svg?style=flat-square)](https://www.npmjs.com/package/dplayer)
[![npm](https://img.shields.io/npm/l/dplayer.svg?style=flat-square)](https://github.com/MoePlayer/DPlayer/blob/master/LICENSE)
[![npm](https://img.shields.io/npm/dt/dplayer.svg?style=flat-square)](https://www.npmjs.com/package/dplayer)
[![size](https://badge-size.herokuapp.com/MoePlayer/DPlayer/master/dist/DPlayer.min.js?compression=gzip&style=flat-square)](https://github.com/MoePlayer/DPlayer/tree/master/dist)

## Introduction

![image](http://i.imgur.com/207ch36.jpg)

DPlayer is a lovely HTML5 danmaku video player to help people build video and danmaku easily.

**DPlayer supports:**

-   Streaming formats
    -   [HLS](https://github.com/video-dev/hls.js)
    -   [FLV](https://github.com/Bilibili/flv.js)
    -   [MPEG DASH](https://github.com/Dash-Industry-Forum/dash.js)
    -   [WebTorrent](https://github.com/webtorrent/webtorrent)
    -   Any other custom streaming formats
-   Media formats
    -   MP4 H.264
    -   WebM
    -   Ogg Theora Vorbis
-   Features
    -   Danmaku
    -   Screenshot
    -   Hotkeys
    -   Quality switching
    -   Thumbnails
    -   Subtitle

Using DPlayer on your project? [Let me know!](https://github.com/DIYgod/DPlayer/issues/31)

**[Docs](http://dplayer.js.org)**

**[中文文档](http://dplayer.js.org/#/zh-Hans/)**

## Thanks

### Sponsors

<div>
<a href="https://www.dogecloud.com/?ref=dplayer" target="_blank">
    <img height="60px" src="https://i.imgur.com/C2NgugY.png">
</a>
</div>

### Contributors

<a href="https://github.com/MoePlayer/DPlayer/graphs/contributors"><img src="https://opencollective.com/DPlayer/contributors.svg?width=890" /></a>

## Related Projects

Feel free to submit yours in [`Let me know!`](https://github.com/MoePlayer/DPlayer/issues/31)

### Tooling

-   [DPlayer-thumbnails](https://github.com/MoePlayer/DPlayer-thumbnails): generate video thumbnails

### Danmaku api

-   [DPlayer-node](https://github.com/MoePlayer/DPlayer-node): Node.js
-   [laravel-danmaku](https://github.com/MoePlayer/laravel-danmaku): PHP
-   [dplayer-live-backend](https://github.com/Izumi-kun/dplayer-live-backend): Node.js, WebSocket live backend
-   [RailsGun](https://github.com/MoePlayer/RailsGun): Ruby

### Plugins

-   [DPlayer-for-typecho](https://github.com/volio/DPlayer-for-typecho): Typecho
-   [Hexo-tag-dplayer](https://github.com/NextMoe/hexo-tag-dplayer): Hexo
-   [DPlayer_for_Z-BlogPHP](https://github.com/fghrsh/DPlayer_for_Z-BlogPHP): Z-BlogPHP
-   [DPlayer for Discuz!](https://coding.net/u/Click_04/p/video/git): Discuz!
-   [DPlayer for WordPress](https://github.com/BlueCocoa/DPlayer-WordPress): WordPress
-   [DPlayerHandle](https://github.com/kn007/DPlayerHandle): WordPress
-   [Selection](https://github.com/GreatSatan79/Selection): WordPress
-   [Vue-DPlayer](https://github.com/sinchang/vue-dplayer): Vue
-   [react-dplayer](https://github.com/hnsylitao/react-dplayer): React

### Other

-   [DPlayer-Lite](https://github.com/kn007/DPlayer-Lite): lite version
-   [hlsjs-p2p-engine](https://github.com/cdnbye/hlsjs-p2p-engine): Let your viewers become your unlimitedly scalable CDN
-   [CBPlayer](https://github.com/cdnbye/CBPlayer): Dplayer with CDNBye P2P plugin built in, supporting HLS, MP4 and MPEG-DASH P2P streaming.
-   Feel free to submit yours in [`Let me know!`](https://github.com/MoePlayer/DPlayer/issues/31)

## Who use DPlayer?

-   [学习强国](https://itunes.apple.com/cn/app/%E5%AD%A6%E4%B9%A0%E5%BC%BA%E5%9B%BD/id1426355645?mt=8): “学习强国”学习平台精心打造的手机客户端
-   [小红书](https://www.xiaohongshu.com/): 中国最大的生活社区分享平台，同时也是发现全球好物的电商平台
-   [极客时间](https://time.geekbang.org/): 极客邦科技出品的一款 IT 内容知识服务 App
-   [嘀哩嘀哩](http://www.dilidili.wang/): 兴趣使然的无名小站（D 站）
-   [银色子弹](https://www.sbsub.com/): 银色子弹，简称银弹，由多数柯南热爱者聚集在一起的组织
-   [浙江大学 CC98 论坛](https://zh.wikipedia.org/wiki/CC98%E8%AE%BA%E5%9D%9B): 浙江大学校网内规模最大的论坛，中国各大学中较活跃的 BBS 之一
-   [纸飞机南航青年网络社区](http://my.nuaa.edu.cn/video-video.html): 南京航空航天大学门户网站
-   [otomads](https://otomads.com/): 专注于音 MAD 的视频弹幕网站
-   [Cloudreve](https://github.com/HFO4/Cloudreve): 基于 ThinkPHP 构建的网盘系统
-   [oneindex](https://github.com/donwa/oneindex): Onedrive Directory Index
-   [arozos](https://github.com/tobychui/arozos): General purposed Web Desktop Operating Platform / OS for Raspberry Pis
-   [新东方云教室](https://roombox.xdf.cn/)
-   Feel free to submit yours in [`Let me know!`](https://github.com/MoePlayer/DPlayer/issues/31)

## Donate

DPlayer is an MIT licensed open source project and completely free to use. However, the amount of effort needed to maintain and develop new features for the project is not sustainable without proper financial backing.

You can support DPlayer via donations.

### Recurring Donation

-   Become a Sponser on [GitHub](https://github.com/sponsors/DIYgod)
-   Become a Sponser on [Patreon](https://www.patreon.com/DIYgod)
-   Become a Sponser on [爱发电](https://afdian.net/@diygod)
-   Contact us directly: i@diygod.me

### One-time Donation

We accept donations via the following ways:

-   [WeChat Pay](https://diygod.me/images/wx.jpg)
-   [Alipay](https://diygod.me/images/zfb.jpg)
-   [Paypal](https://www.paypal.me/DIYgod)

## Author

**DPlayer** © [DIYgod](https://github.com/DIYgod), Released under the [MIT](./LICENSE) License.<br>
Authored and maintained by DIYgod with help from contributors ([list](https://github.com/DIYgod/DPlayer/contributors)).

> [Blog](https://diygod.me) · GitHub [@DIYgod](https://github.com/DIYgod) · Twitter [@DIYgod](https://twitter.com/DIYgod) · Telegram Channel [@awesomeDIYgod](https://t.me/awesomeDIYgod)
