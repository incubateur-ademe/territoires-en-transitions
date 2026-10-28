import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Result } from '@tet/backend/utils/result.type';

/**
 * Un outil MCP s'enregistre sur le serveur construit pour une requête ; il
 * capture l'utilisateur authentifié et le passe aux services applicatifs.
 */
export interface McpTool {
  register(server: McpServer, user: AuthenticatedUser): void;
}

/**
 * Convertit un `Result` en réponse d'outil : le succès est renvoyé en texte
 * JSON et en `structuredContent`, l'échec en `isError` avec le code et la
 * cause, lisibles par le modèle pour corriger sa requête.
 */
export function toToolResult<Data extends Record<string, unknown>>(
  result: Result<Data, string>
): CallToolResult {
  if (result.success) {
    return {
      content: [{ type: 'text', text: JSON.stringify(result.data) }],
      structuredContent: result.data,
    };
  }
  const detail = result.cause?.message ? ` : ${result.cause.message}` : '';
  return {
    isError: true,
    content: [{ type: 'text', text: `${result.error}${detail}` }],
  };
}
