import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  getCollectiviteInputSchema,
  getCollectiviteOutputSchema,
  GetCollectiviteService,
} from './get-collectivite.service';

@Injectable()
export class GetCollectiviteTool implements McpTool {
  constructor(
    private readonly getCollectiviteService: GetCollectiviteService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'get_collectivite',
      {
        title: "Fiche d'une collectivité",
        description:
          "Identité d'une collectivité (nom, type, SIREN, région, département, population, COT actif, accès restreint) avec son nombre de membres actifs et de plans d'action, à partir de son identifiant TeT ou de son SIREN.",
        inputSchema: getCollectiviteInputSchema,
        outputSchema: getCollectiviteOutputSchema,
        annotations: READ_ONLY_TOOL_ANNOTATIONS,
      },
      async (input) =>
        toToolResult(await this.getCollectiviteService.run(input, { user }))
    );
  }
}
