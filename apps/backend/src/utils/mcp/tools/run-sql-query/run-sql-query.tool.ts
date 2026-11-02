import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { MCP_PREVIEW_ROWS } from '../../mcp.constants';
import { runSqlQueryInputSchema } from './run-sql-query.input';
import {
  runSqlQueryOutputSchema,
  RunSqlQueryService,
} from './run-sql-query.service';

const DESCRIPTION = `Exécute une requête SQL SELECT en lecture seule sur la base analytique de Territoires en Transitions et renvoie un aperçu de ${MCP_PREVIEW_ROWS} lignes au maximum avec le nombre total de lignes.

Deux schémas :
- \`public\` : statistiques pré-agrégées quotidiennement (activité, activation, plans pilotables, labellisation…), collectivités de test et utilisateurs internes déjà exclus. À privilégier pour les questions d'usage et de métriques.
- \`prod\` : miroir des données applicatives (collectivités, plans, fiches action, indicateurs, référentiels), pour le détail. Exclure les collectivités de test (\`type != 'test'\`).

Règles : une seule instruction, tables toujours préfixées de leur schéma, pas d'information_schema (utiliser list_tables et describe_table). Lire d'abord la ressource tet://docs/regles-metier. Si l'aperçu est tronqué, agréger ou filtrer davantage plutôt que de lister. N'annoncer aucun chiffre qui ne vient pas d'un résultat.`;

@Injectable()
export class RunSqlQueryTool implements McpTool {
  constructor(private readonly runSqlQueryService: RunSqlQueryService) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'run_sql_query',
      {
        title: 'Requête SQL sur la base analytique',
        description: DESCRIPTION,
        inputSchema: runSqlQueryInputSchema,
        outputSchema: runSqlQueryOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input) =>
        toToolResult(await this.runSqlQueryService.run(input, { user }))
    );
  }
}
