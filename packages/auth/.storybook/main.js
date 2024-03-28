/**
 * Configuration générale du storybook
 */

const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
  // pattern de recherche des stories
  stories: ['../**/*.stories.tsx'],

  // extensions chargées
  addons: [
    // les extensions les plus utilisées (Actions, Controls, Docs...)
    '@storybook/addon-essentials',
    // pour faire fonctionner tailwind dans le storybook
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        rules: [
          {
            test: /\.css$/,
            use: [
              require.resolve('style-loader'),
              {
                loader: require.resolve('css-loader'),
                options: {importLoaders: 1},
              },
              require.resolve('postcss-loader'),
            ],
          },
        ],
      },
    },
  ],

  // ajoute les alias de chemins d'import définis dans la config TS
  webpackFinal: config => {
    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push(
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, '../tsconfig.json'),
      }),
    );

    return config;
  },

  framework: '@storybook/nextjs',

  docs: {
    autodocs: true,
  },
  core: {
    builder: 'webpack5',
    disableTelemetry: true,
  },
};
