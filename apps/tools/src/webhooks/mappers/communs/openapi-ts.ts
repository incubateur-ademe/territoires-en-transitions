import { defaultPlugins } from '@hey-api/openapi-ts';

export default {
  input: 'https://api.collectivites.beta.gouv.fr/api/projets/openapi.json',
  output: 'client',
  plugins: [
    ...defaultPlugins,
    '@hey-api/client-fetch',
    {
      name: '@hey-api/typescript',
    },
  ],
};
