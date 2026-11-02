export const MCP_SERVER_NAME = 'territoires-en-transitions';

/** Chemin public du serveur MCP, préfixe global `api/v1` compris. */
export const MCP_RESOURCE_PATH = '/api/v1/mcp';

/** Métadonnées de ressource protégée (RFC 9728), hors préfixe global. */
export const MCP_PROTECTED_RESOURCE_METADATA_PATH =
  '/.well-known/oauth-protected-resource';

/** Jeton d'injection de la liste des outils enregistrés sur le serveur MCP. */
export const MCP_TOOLS = Symbol('MCP_TOOLS');

/** Lignes renvoyées au modèle par un outil de requête : au-delà, il affiche
 * le total et invite à filtrer ou agréger. */
export const MCP_PREVIEW_ROWS = 20;

export const MCP_MAX_SQL_LENGTH = 10_000;

/** Lignes maximum relues depuis `information_schema` par `describe_table`. */
export const MCP_MAX_SCHEMA_ROWS = 1_000;
