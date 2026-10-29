import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  listCollectivitePlansInputSchema,
  listCollectivitePlansOutputSchema,
  ListCollectivitePlansService,
} from './list-plans.service';

@Injectable()
export class ListCollectivitePlansTool implements McpTool {
  constructor(
    private readonly listCollectivitePlansService: ListCollectivitePlansService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'list_plans',
      {
        title: "Plans d'action d'une collectivité et leur activité",
        description:
          "Liste les plans d'action d'une collectivité (50 au plus) avec leur type, leur statut, leurs pilotes et référents (noms), le nombre de fiches, la répartition des fiches par statut, la date de dernière modification d'une fiche et le nombre de fiches modifiées sur 90 jours. Sous-actions et fiches supprimées sont exclues des statuts et de l'activité.",
        inputSchema: listCollectivitePlansInputSchema,
        outputSchema: listCollectivitePlansOutputSchema,
        annotations: READ_ONLY_TOOL_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(
          await this.listCollectivitePlansService.run(input, { user })
        )
    );
  }
}
