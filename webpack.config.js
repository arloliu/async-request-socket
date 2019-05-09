const path = require('path');
// const webpack = require('webpack');

module.exports = {
    target: 'web',
    entry: {
        app: [path.resolve('src', 'ws-factory.js')],
    },
    // where to dump the output of a production build
    output: {
        path: path.resolve('dist'),
        filename: 'async-request-socket.min.js',
        library: 'AsyncRequestSocket',
        libraryTarget: 'umd',
        umdNamedDefine: true,
    },
    module: {
        rules: [
            {
                test: /\.js$/i,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    resolve: {
        alias: {
            uws: path.resolve(__dirname, 'node_modules', 'ws'),
        },
    },
    externals: {
        uws: 'uws',
    },
    optimization: {
    },
    node: {
        Buffer: true,
    },
};
