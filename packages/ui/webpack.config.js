const path = require('path');

/** Configuration Webpack */
module.exports = function (env, argv) {
  return {
    // configuration en fonction de l'environnement cible
    mode: env.production ? 'production' : 'development',
    devtool: env.production ? 'source-map' : 'inline-source-map',

    // chemin de base
    context: path.resolve(__dirname),
    // point d'entrée de la bibliothèque
    entry: './src/index.ts',

    // traitement des fichiers
    module: {
      rules: [
        // transpilation des fichiers TS
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        // traitement des fichiers css
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { importLoaders: 1 },
            },
            'postcss-loader',
          ],
        },
      ],
    },

    // ordre de résolution des modules js par extension
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },

    // exclut du bundle les bibliothèques externes
    externals: {
      react: 'react',
      'react-dom': 'react-dom',
      classnames: 'classnames',
      '@floating-ui/react': '@floating-ui/react',
    },

    // configuration de la génération
    output: {
      filename: 'index.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
      // type d'exports générés
      library: { type: 'umd' },
    },
  };
};
