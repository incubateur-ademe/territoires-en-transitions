/**
 * Configuration générale du storybook
 */
module.exports = {
  // pattern de recherche des stories
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.tsx'],

  // extensions chargées
  addons: [
    // les extensions les plus utilisées (Actions, Controls, Docs...)
    '@storybook/addon-essentials',
  ],

  framework: '@storybook/react-webpack5',

  docs: {
    autodocs: true,
  },
  core: {
    builder: 'webpack5',
    disableTelemetry: true,
  },
};
