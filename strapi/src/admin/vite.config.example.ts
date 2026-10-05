import { mergeConfig, type UserConfig } from 'vite';

export default (config: UserConfig) => {
  // Toujours renvoyer la config fusionnée
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  });
};
