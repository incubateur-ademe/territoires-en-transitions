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
    // pour charger la surcharge de la config create-react-app fournie par craco
    'storybook-preset-craco',
    // et la faire fonctionner avec le addon Docs
    {
      name: '@storybook/addon-docs',
      options: {
        configureJSX: true,
      },
    },
  ],
  framework: '@storybook/react',
  staticDirs: [
    '../public',
    '../src/app/static/_app/assets/css',
    {from: '../src/app/static/_app/assets/fonts', to: '/fonts'},
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
};
