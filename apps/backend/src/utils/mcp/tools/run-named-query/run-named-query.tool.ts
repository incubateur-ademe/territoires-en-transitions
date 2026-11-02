import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { z } from 'zod';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  listNamedQueriesOutputSchema,
  runNamedQueryInputSchema,
  runNamedQueryOutputSchema,
  RunNamedQueryService,
} from './run-named-query.service';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

@Injectable()
export class RunNamedQueryTool implements McpTool {
  constructor(private readonly runNamedQueryService: RunNamedQueryService) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'list_named_queries',
      {
        title: 'Requêtes revues pour les questions récurrentes',
        description:
          "Liste les requêtes SQL déjà revues par l'équipe data (activation, activité, plans actifs, labellisation) avec leurs paramètres. À consulter avant d'écrire du SQL : si une requête répond à la question, utiliser run_named_query.",
        inputSchema: z.object({}),
        outputSchema: listNamedQueriesOutputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async () =>
        toToolResult({ success: true, data: this.runNamedQueryService.list() })
    );

    server.registerTool(
      'run_named_query',
      {
        title: 'Exécuter une requête revue',
        description:
          'Exécute une requête de list_named_queries avec ses paramètres et renvoie les lignes, la requête SQL exécutée (à citer) et le nombre total de lignes.',
        inputSchema: runNamedQueryInputSchema,
        outputSchema: runNamedQueryOutputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(await this.runNamedQueryService.run(input, { user }))
    );
  }
}
