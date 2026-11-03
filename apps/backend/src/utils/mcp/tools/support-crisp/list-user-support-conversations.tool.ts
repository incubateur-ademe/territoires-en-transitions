import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';
import {
  listUserSupportConversationsInputSchema,
  listUserSupportConversationsOutputSchema,
  ListUserSupportConversationsService,
} from './list-user-support-conversations.service';

const DESCRIPTION = `Historique des échanges d'un usager avec le support (conversations Crisp), à partir de son e-mail : les 10 plus récentes, avec date, segments, résolue ou non, sa demande et la dernière réponse du support (e-mails et téléphones masqués). La conversation en cours en fait partie, c'est la plus récente. Sert à répondre à « qu'a-t-il déjà demandé ? », « est-ce récurrent ? ». Ne recopier ni l'e-mail ni le nom de l'usager.`;

@Injectable()
export class ListUserSupportConversationsTool implements McpTool {
  constructor(
    private readonly listUserSupportConversationsService: ListUserSupportConversationsService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'list_user_support_conversations',
      {
        title: "Historique d'un usager avec le support",
        description: DESCRIPTION,
        inputSchema: listUserSupportConversationsInputSchema,
        outputSchema: listUserSupportConversationsOutputSchema,
        annotations: { ...READ_ONLY_TOOL_ANNOTATIONS, openWorldHint: true },
      },
      async (input) =>
        toToolResult(
          await this.listUserSupportConversationsService.run(input, { user })
        )
    );
  }
}
