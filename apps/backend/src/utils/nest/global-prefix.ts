export const GLOBAL_PREFIX = 'api/v1';

/** Routes servies à la racine du domaine, hors préfixe d'API. */
export const GLOBAL_PREFIX_EXCLUDED_PATHS = [
  'version',
  'throw',
  // KPI publique au chemin imposé par la spec commune des startups.
  'api/stats',
  // Découverte OAuth des clients MCP (RFC 9728) : à la racine du domaine.
  '.well-known/oauth-protected-resource',
  '.well-known/oauth-protected-resource/api/v1/mcp',
];
