import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  describeTableInputSchema,
  describeTableOutputSchema,
  DescribeTableService,
  listTablesInputSchema,
  listTablesOutputSchema,
} from './describe-table.service';

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

@Injectable()
export class DescribeTableTool implements McpTool {
  constructor(private readonly describeTableService: DescribeTableService) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'list_tables',
      {
        title: "Tables d'un schéma de la base analytique",
        description:
          "Liste les tables et vues accessibles d'un schéma de la base analytique ('public' pour les statistiques, 'prod' pour le miroir applicatif). À utiliser pour vérifier le nom exact d'une table avant run_sql_query.",
        inputSchema: listTablesInputSchema,
        outputSchema: listTablesOutputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(
          await this.describeTableService.listTables(input, { user })
        )
    );

    server.registerTool(
      'describe_table',
      {
        title: "Colonnes d'une table de la base analytique",
        description:
          "Donne les colonnes (nom, type, nullabilité) d'une table ou vue de la base analytique. Remplace toute requête sur information_schema.",
        inputSchema: describeTableInputSchema,
        outputSchema: describeTableOutputSchema,
        annotations: READ_ONLY_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(
          await this.describeTableService.describeTable(input, { user })
        )
    );
  }
}
