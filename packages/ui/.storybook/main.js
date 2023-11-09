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
                options: { importLoaders: 1 },
              },
              require.resolve('postcss-loader'),
            ],
          },
        ],
      },
    },
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
