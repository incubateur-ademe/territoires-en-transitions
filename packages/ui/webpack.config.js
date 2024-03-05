const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

function getPeerDependencies() {
  try {
    const pkg = require(path.resolve(process.cwd(), 'package.json'));
    return Object.keys(pkg.peerDependencies);
  } catch (err) {
    return [];
  }
}

/** Configuration Webpack */
module.exports = function (env, argv) {
  // génère la liste des modules à exclure du build depuis les peerDeps du package
  const externals = Object.fromEntries(getPeerDependencies().map(d => [d, d]));

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
      ],
    },

    // exporte la feuille de styles globale sans traitement
    plugins: [
      new CopyPlugin({
        patterns: [{from: 'src/global.css', to: ''}],
      }),
    ],

    resolve: {
      // ordre de résolution des modules js par extension
      extensions: ['.tsx', '.ts', '.js'],
      // ajoute les alias de chemins d'import définis dans la config TS
      plugins: [new TsconfigPathsPlugin()],
    },

    // exclut du bundle les bibliothèques externes
    externals,

    // configuration de la génération
    output: {
      // le point d'entrée de notre module
      filename: 'index.js',
      // le chemin du répertoire cible du build
      path: path.resolve(__dirname, 'dist'),
      // permet que le build UMD soit compatible node & browser
      globalObject: 'this',
      // type d'exports générés
      library: {type: 'umd', name: 'ui', umdNamedDefine: true},
    },
  };
};
