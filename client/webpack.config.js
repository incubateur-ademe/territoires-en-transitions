const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const mode = process.env.NODE_ENV || 'development'

module.exports = {
    entry: {
        app: path.resolve(__dirname, 'src/app.ts'),
        mesure_personnalisee: path.resolve(__dirname, 'src/mesure_personnalisee.ts'),
        mesure_ajout: path.resolve(__dirname, 'src/mesure_ajout.ts'),
        mesures: path.resolve(__dirname, 'src/mesures.ts'),
        action_ajout: path.resolve(__dirname, 'src/action_ajout.ts'),
        navigation: path.resolve(__dirname, 'src/navigation.ts'),
        ecpi_button_list: path.resolve(__dirname, 'src/ecpi_button_list.ts'),
        ecpi_nav_display: path.resolve(__dirname, 'src/ecpi_nav_display.ts'),
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    resolve: {
        // Add '.ts', '.svelte' and '.js' as resolvable extensions in this order.
        extensions: ['.ts', '.svelte', '.js'],
        // Enable correct import of Svelte modules
        alias: {
            svelte: path.dirname(require.resolve('svelte/package.json'))
        },
        // Check these fields in the package.json of the imported modules
        mainFields: ['svelte', 'browser', 'module', 'main']
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'styles.css',
        }),
    ],
    module: {
        rules: [
            // All files with a '.css' extension will be handled by:
            //   1- postcss-loader: process CSS with PostCSS,
            //   2- css-loader: interprets @import and url() resolve them,
            //   3- MiniCssExtractPlugin: extract CSS output into a separated CSS
            //      file.
            {
                test: /\.css$/i,
                exclude: /node_modules/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
            },

            // All files with a '.ts' extension, except in the `node_modules`folder,
            // will be handled by ts-loader.
            {
                test: /\.ts?$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
            },

            // All Svelte files are handled by svelte-loader
            {
                test: /\.svelte$/,
                exclude: /node_modules/,
                use: {
                    loader: 'svelte-loader',
                    options: {
                        emitCss: true,
                        preprocess: require('svelte-preprocess')({})
                    },
                }
            },

            // All JS output files will have any sourcemaps re-processed by
            // source-map-loader.
            {test: /\.js$/, loader: 'source-map-loader'},

            // This patch is required to prevent errors from Svelte on Webpack 5+
            // cf. https://github.com/sveltejs/template-webpack/blob/master/webpack.config.js
            {
                test: /node_modules\/svelte\/.*\.mjs$/,
                resolve: {
                    fullySpecified: false
                }
            }
        ],
    },

    // Define the current mode (development/production) for Webpack
    mode,

    // Enable sourcemaps for debugging webpack's output.
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './dist',
        hot: true,
    },
}