const path = require('path');
const webpack = require('webpack');
const { GitRevisionPlugin } = require('git-revision-webpack-plugin');
const gitRevisionPlugin = new GitRevisionPlugin();
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

/** @type {import('webpack').Configuration} */
module.exports = {

    // development build
    mode: 'development',

    // entry point
    entry: {
        DPlayer: './src/ts/index.ts',
    },

    // enable source map
    devtool: 'cheap-module-source-map',

    // output settings
    output: {
        path: path.resolve(__dirname, '..', 'dist'),
        filename: '[name].js',
        library: '[name]',
        libraryTarget: 'umd',
        libraryExport: 'default',
        umdNamedDefine: true,
        publicPath: '/',
    },

    // show error details
    stats: {
        errorDetails: true,
        children: true,
    },

    // mitigate maximum asset size
    performance: {
        maxAssetSize: 500000,
        maxEntrypointSize: 500000,
    },

    // webpack-dev-server settings
    devServer: {
        compress: true,
        open: true,
        historyApiFallback: {
            disableDotRule: true,
        },
        static: [
            {
                directory: path.resolve(__dirname, '..', 'demo'),
                watch: {
                    ignored: /node_modules/,
                },
            },
            {
                // Serve the prebuilt mpeg2toh264 ESM and resolve its worker relative to the package
                directory: path.resolve(__dirname, '..', 'node_modules', 'mpeg2toh264', 'packages', 'player', 'dist'),
                publicPath: '/mpeg2toh264/player',
                watch: false,
            },
            {
                // Serve the prebuilt YADIF ESM from the same Git dependency outside the DPlayer bundle
                directory: path.resolve(__dirname, '..', 'node_modules', 'mpeg2toh264', 'packages', 'yadif', 'dist'),
                publicPath: '/mpeg2toh264/yadif',
                watch: false,
            },
            ...(process.env.DPLAYER_RECORDINGS_DIR ? [{
                directory: path.resolve(process.env.DPLAYER_RECORDINGS_DIR),
                publicPath: '/recordings',
                serveIndex: true,
                watch: false,
            }] : []),
        ],
    },

    // resolve modules
    resolve: {
        extensions: ['.ts', '.js', '.scss'],
    },

    // loader settings
    module: {
        strictExportPresence: true,
        rules: [
            {
                // compile TypeScript to JavaScript
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
            {
                // load source map
                test: /\.js$/,
                use: [
                    {
                        loader: 'source-map-loader',
                    },
                ],
            },
            {
                // compile JavaScript in Babel
                test: /\.js$/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: true,
                            presets: ['@babel/preset-env'],
                        },
                    },
                ],
            },
            {
                test: /\.scss$/,
                use: [
                    // inject CSS into the DOM
                    'style-loader',
                    // load CSS
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        },
                    },
                    // enable Autoprefixer and cssnano
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [autoprefixer, cssnano],
                            },
                        },
                    },
                    // compile SASS (SCSS) to CSS
                    'sass-loader',
                ],
            },
            {
                // bundle images inline
                test: /\.(png|jpg)$/,
                type: 'asset/inline',
            },
            {
                // bundle svg icons (with html)
                test: /\.svg$/,
                loader: 'svg-inline-loader',
            },
            {
                // ART template to JavaScript
                test: /\.art$/,
                loader: 'art-template-loader',
            },
        ],
    },

    // define DPlayer version and Git hash
    plugins: [
        new webpack.DefinePlugin({
            DPLAYER_VERSION: `"${require('../package.json').version}"`,
            GIT_HASH: JSON.stringify(gitRevisionPlugin.version()),
        }),
    ],
};
