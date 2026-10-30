import { ENV } from '@tet/api/environmentVariables';

/** Même chemin que `MCP_RESOURCE_PATH` côté backend (`utils/mcp`). */
const MCP_RESOURCE_PATH = '/api/v1/mcp';

/** Adresse à coller dans Claude : l'URL publique de l'API, pas le proxy de l'app. */
export const getMcpConnectorUrl = () =>
  `${(ENV.backend_url ?? '').replace(/\/$/, '')}${MCP_RESOURCE_PATH}`;
