import { defaultPlugins } from '@hey-api/openapi-ts';

export default {
  input:
    'https://les-communs-transition-ecologique-api-staging.osc-fr1.scalingo.io/openapi.json',
  output: 'client',
  plugins: [
    ...defaultPlugins,
    '@hey-api/client-fetch',
    {
      name: '@hey-api/typescript',
    },
  ],
};
