import type { StorybookConfig } from '@storybook/react-webpack5';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const config: StorybookConfig = {
  framework: '@storybook/react-webpack5',
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-webpack5-compiler-babel',
    {
      // Pour faire fonctionner Tailwind dans Storybook
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
  stories: ['../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],

  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.plugins = [
        ...(config.resolve.plugins || []),
        new TsconfigPathsPlugin({
          extensions: config.resolve.extensions,
          // configFile: path.resolve(__dirname, '../tsconfig.json'),
        }),
      ];
    }
    return config;
  },

  docs: {
    autodocs: true,
  },

  core: {
    builder: '@storybook/builder-webpack5',
    disableTelemetry: true,
  },
};

export default config;
