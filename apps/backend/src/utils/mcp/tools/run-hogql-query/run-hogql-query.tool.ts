import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { MCP_PREVIEW_ROWS } from '../../mcp.constants';
import { runHogqlQueryInputSchema } from './run-hogql-query.input';
import {
  runHogqlQueryOutputSchema,
  RunHogqlQueryService,
} from './run-hogql-query.service';
import { HOGQL_MAX_WINDOWS } from './window-hogql.rules';

const DESCRIPTION = `Exécute une requête HogQL sur PostHog (événements de l'application : pages vues, navigation, usage fin d'une fonctionnalité) et renvoie un aperçu de ${MCP_PREVIEW_ROWS} lignes au maximum avec le nombre total de lignes.

À n'utiliser que pour des données que seul PostHog possède : pour l'activité et la fréquentation, préférer public.activite_semaine via run_sql_query. Mettre toujours un LIMIT explicite (50 000 au maximum) et un filtre de date ; agréger côté PostHog plutôt que rapatrier des événements bruts.

Si la requête contient les marqueurs {start} et {end}, elle est exécutée mois par mois entre dateFrom et dateTo (${HOGQL_MAX_WINDOWS} mois au maximum), puis les résultats sont concaténés et dédoublonnés ; meta.truncatedWindows liste les fenêtres incomplètes. Les utilisateurs internes sont retirés sur toute colonne nommée email, puis les colonnes e-mail sont supprimées du résultat. Lire d'abord la ressource tet://docs/posthog-hogql.`;

@Injectable()
export class RunHogqlQueryTool implements McpTool {
  constructor(private readonly runHogqlQueryService: RunHogqlQueryService) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'run_hogql_query',
      {
        title: 'Requête HogQL sur PostHog',
        description: DESCRIPTION,
        inputSchema: runHogqlQueryInputSchema,
        outputSchema: runHogqlQueryOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (input) =>
        toToolResult(await this.runHogqlQueryService.run(input, { user }))
    );
  }
}
