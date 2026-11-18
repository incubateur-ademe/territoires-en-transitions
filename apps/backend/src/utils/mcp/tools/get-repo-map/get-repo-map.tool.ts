import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpTool } from '../../mcp-tool.interface';
import {
  CARTE_DU_DEPOT_DOC,
  REPO_FULL_NAME,
} from '../../resources/carte-du-depot.doc';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';

export const GET_REPO_MAP_TOOL = 'get_repo_map';

/**
 * Sert la carte du dépôt aux clients qui ne lisent pas les ressources MCP :
 * où chercher dans le code avant d'affirmer quoi que ce soit sur le
 * fonctionnement de la plateforme.
 */
@Injectable()
export class GetRepoMapTool implements McpTool {
  register(server: McpServer): void {
    server.registerTool(
      GET_REPO_MAP_TOOL,
      {
        title: 'Carte du dépôt de code',
        description: `À appeler avant de répondre à toute question sur le fonctionnement de la plateforme (comment faire, qui a le droit, pourquoi un blocage, ce que fait un écran, comment un chiffre est calculé). Renvoie l'organisation du dépôt public ${REPO_FULL_NAME} : dossiers par domaine, sens des suffixes de fichiers, où lire les droits, les règles et les textes d'interface. La carte dit où chercher, pas ce que fait le code : lire ensuite les fichiers avec un outil de lecture du dépôt (connecteur GitHub) et les citer. Sans un tel outil, demander à l'utilisateur d'installer le connecteur GitHub au lieu de répondre de mémoire.`,
        inputSchema: z.object({}),
        annotations: READ_ONLY_TOOL_ANNOTATIONS,
      },
      async () => ({
        content: [{ type: 'text', text: CARTE_DU_DEPOT_DOC }],
      })
    );
  }
}
