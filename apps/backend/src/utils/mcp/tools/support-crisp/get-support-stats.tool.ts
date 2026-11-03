import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  getSupportStatsInputSchema,
  getSupportStatsOutputSchema,
  GetSupportStatsService,
} from './get-support-stats.service';

const DESCRIPTION = `Statistiques du support (conversations Crisp) sur un sujet et une période : volume par mois ou par semaine, part de tout le support, types de retours (besoin_guidage, bug, amelioration, metier, support_obligatoire, autre), segments détaillés, parcours (assistant accepté, support demandé, reprise humaine) et temps passé par le support, estimé.

Le sujet se cherche dans les segments Crisp (ex. 'cr' pour le référentiel CR, 'referentiel', 'import_plan') : c'est le filtre à utiliser dès qu'un segment existe. termes cherche des mots dans les messages, seulement pour un sujet sans segment. Les chiffres sont calculés par l'outil : les recopier tels quels, avec la période, les avertissements et la mention « estimé » pour le temps. Pour décrire le contenu des demandes, appeler ensuite sample_support_conversations. Lire la ressource tet://docs/support-crisp pour la taxonomie.`;

@Injectable()
export class GetSupportStatsTool implements McpTool {
  constructor(
    private readonly getSupportStatsService: GetSupportStatsService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'get_support_stats',
      {
        title: 'Statistiques du support Crisp',
        description: DESCRIPTION,
        inputSchema: getSupportStatsInputSchema,
        outputSchema: getSupportStatsOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (input) =>
        toToolResult(await this.getSupportStatsService.run(input, { user }))
    );
  }
}
