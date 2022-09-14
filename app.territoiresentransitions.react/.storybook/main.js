/**
 * Configuration générale du storybook
 */
module.exports = {
  // pattern de recherche des stories
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  // extensions chargées
  addons: [
    // pour faire des liens entre les stories
    '@storybook/addon-links',
    // les extensions les plus utilisées (Actions, Controls, Docs...)
    '@storybook/addon-essentials',
    '@storybook/preset-create-react-app',
  ],
  framework: '@storybook/react',
  core: {
    builder: 'webpack5',
  },
  staticDirs: [
    '../public',
    '../src/app/static/_app/assets/css',
    {
      from: '../src/app/static/_app/assets/fonts',
      to: '/fonts',
    },
  ],
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      compilerOptions: {
        allowSyntheticDefaultImports: false,
        esModuleInterop: false,
      },
    },
  },
  // chargement des mocks pour le bon fonctionnement des stories dans le storybook
  // ATTENTION : il faut aussi charger les mocks dans setupTests pour qu'ils
  // soient accessibles lors du snapshot testing (storyshots)
  webpackFinal: async config => {
    config.resolve.alias['core-logic/hooks/useCurrentCollectivite'] =
      require.resolve(
        '../src/core-logic/hooks/__mocks__/useCurrentCollectivite.ts'
      );
    return config;
  },
};
