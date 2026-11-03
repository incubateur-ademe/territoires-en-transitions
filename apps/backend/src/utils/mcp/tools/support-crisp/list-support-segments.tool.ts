import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  listSupportSegmentsInputSchema,
  listSupportSegmentsOutputSchema,
  ListSupportSegmentsService,
} from './list-support-segments.service';

const DESCRIPTION = `Segments Crisp utilisés par le support sur une période (90 jours par défaut), rangés par type de retour, avec leur nombre de conversations et leurs variantes d'orthographe. Sert à choisir le bon sujet pour get_support_stats, à proposer des choix quand la demande est floue, et à réutiliser un segment existant avant d'en ajouter un.`;

@Injectable()
export class ListSupportSegmentsTool implements McpTool {
  constructor(
    private readonly listSupportSegmentsService: ListSupportSegmentsService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'list_support_segments',
      {
        title: 'Segments du support Crisp',
        description: DESCRIPTION,
        inputSchema: listSupportSegmentsInputSchema,
        outputSchema: listSupportSegmentsOutputSchema,
        annotations: { ...READ_ONLY_TOOL_ANNOTATIONS, openWorldHint: true },
      },
      async (input) =>
        toToolResult(await this.listSupportSegmentsService.run(input, { user }))
    );
  }
}
