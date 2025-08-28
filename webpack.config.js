const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
    const isProd = argv.mode === 'production';

    return {
        entry: './src/main.js',
        output: {
            filename: 'custom.js',
            path: path.resolve(__dirname, 'js'),
            // keep hot artifacts out of the root js/ if someone re-enables HMR later
            hotUpdateMainFilename: 'hot/[fullhash].hot-update.json',
            hotUpdateChunkFilename: 'hot/[id].[fullhash].hot-update.js',
            clean: isProd // wipe js/ on prod builds
        },
        module: {
            rules: [
                { test: /\.(woff2?|ttf|otf|eot)$/i, type: 'asset/inline' },
                {
                    test: /\.css$/,
                    use: [
                        { loader: MiniCssExtractPlugin.loader, options: { publicPath: '../' } },
                        'css-loader'
                    ]
                }
            ]
        },
        plugins: [
            new MiniCssExtractPlugin({ filename: '../css/custom.css' })
        ],
        devServer: {
            static: { directory: path.resolve(__dirname) },
            devMiddleware: { writeToDisk: true },
            watchFiles: ['src/**/*.js', 'index.html'],
            port: 9000,
            open: false,
            client: { logging: 'info' },
            hot: false,          // ← disable HMR (stops *.hot-update.* files)
            liveReload: true,    // simple full-page reload on change
            setupMiddlewares: (middlewares, devServer) => {
                if (!devServer) throw new Error('webpack-dev-server is not defined');
                devServer.app.use((req, res, next) => {
                    res.on('finish', () => {
                        const timeStamp = new Date().toISOString();
                        const { method, url } = req;
                        const { statusCode } = res;
                        let icon = '⚠️ ', color = '\x1b[33m';
                        if (statusCode >= 200 && statusCode < 300) { icon = '✅'; color = '\x1b[32m'; }
                        else if (statusCode >= 400 && statusCode < 500) { icon = '❌'; color = '\x1b[31m'; }
                        const reset = '\x1b[0m';
                        console.log(`[${timeStamp}] ${icon} [${color}${statusCode}${reset}] [${method} ${url}]`);
                    });
                    next();
                });
                return middlewares;
            }
        },
        resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
        devtool: isProd ? false : 'source-map',
        mode: isProd ? 'production' : 'development'
    };
};
