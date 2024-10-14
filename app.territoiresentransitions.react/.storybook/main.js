const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

/**
 * Configuration générale du storybook
 */
module.exports = {
  // pattern de recherche des stories
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],

  // extensions chargées
  addons: [
    // les extensions les plus utilisées (Actions, Controls, Docs...)
    '@storybook/addon-essentials',
    '@storybook/preset-create-react-app',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  staticDirs: ['../public'],

  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },

  webpackFinal: async (config) => {
    // loader pour transpiler les fichiers TS
    config.module?.rules?.push({
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/,
    });

    // chargement des mocks pour le bon fonctionnement des stories dans le storybook
    config.resolve.alias['core-logic/hooks/useCurrentCollectivite'] =
      require.resolve(
        '../src/core-logic/hooks/__mocks__/useCurrentCollectivite.ts'
      );

    config.resolve.plugins = config.resolve.plugins || [];
    config.resolve.plugins.push(
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, '../tsconfig.json'),
      })
    );

    return config;
  },

  docs: {
    autodocs: true,
  },
  core: {
    builder: 'webpack5',
    disableTelemetry: true,
  },
};
