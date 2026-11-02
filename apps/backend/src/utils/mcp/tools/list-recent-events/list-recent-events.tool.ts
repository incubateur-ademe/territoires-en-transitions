import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  listRecentEventsInputSchema,
  listRecentEventsOutputSchema,
  ListRecentEventsService,
} from './list-recent-events.service';

@Injectable()
export class ListRecentEventsTool implements McpTool {
  constructor(
    private readonly listRecentEventsService: ListRecentEventsService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'list_recent_events',
      {
        title: "Derniers événements PostHog d'un utilisateur",
        description:
          "Les 50 derniers événements PostHog (pages vues, actions) d'un utilisateur sur une période (30 jours par défaut, 90 au plus), avec la page et la collectivité concernées. Sert à comprendre un parcours ou un blocage signalé au support. Même règle d'accès que find_user.",
        inputSchema: listRecentEventsInputSchema,
        outputSchema: listRecentEventsOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (input) =>
        toToolResult(await this.listRecentEventsService.run(input, { user }))
    );
  }
}
