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
        DPlayer: './src/js/index.js',
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
        static: {
            directory: path.resolve(__dirname, '..', 'demo'),
            watch: {
                ignored: /node_modules/,
            },
        }
    },

    // loader settings
    module: {
        strictExportPresence: true,
        rules: [
            {
                test: /\.js$/,
                use: [
                    // compile JavaScript in Babel
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
