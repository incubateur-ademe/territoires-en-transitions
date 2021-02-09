const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = {
  entry: path.resolve(__dirname, 'src/app.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions in this order.
    extensions: ['.ts', '.js'],
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

      // All JS output files will have any sourcemaps re-processed by
      // source-map-loader.
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
  // Enable sourcemaps for debugging webpack's output.
  devtool: 'inline-source-map',
  devServer: {
    contentBase: './dist',
  },
}
