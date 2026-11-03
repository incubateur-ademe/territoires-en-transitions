import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  sampleSupportConversationsInputSchema,
  sampleSupportConversationsOutputSchema,
  SampleSupportConversationsService,
} from './sample-support-conversations.service';

const DESCRIPTION = `Échantillon de conversations du support (Crisp) sur un sujet, réparti sur la période : date, segments, demande de l'usager et dernière réponse du support, e-mails et téléphones masqués. Sert à synthétiser les retours (thèmes récurrents, blocages, attentes), après get_support_stats qui donne les chiffres.

Regrouper les demandes en 3 à 5 thèmes avec un exemple reformulé chacun ; ne pas citer de nom de personne. L'échantillon n'est pas exhaustif : ne pas en tirer de pourcentage.`;

@Injectable()
export class SampleSupportConversationsTool implements McpTool {
  constructor(
    private readonly sampleSupportConversationsService: SampleSupportConversationsService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'sample_support_conversations',
      {
        title: 'Extraits de conversations du support Crisp',
        description: DESCRIPTION,
        inputSchema: sampleSupportConversationsInputSchema,
        outputSchema: sampleSupportConversationsOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: true,
        },
      },
      async (input) =>
        toToolResult(
          await this.sampleSupportConversationsService.run(input, { user })
        )
    );
  }
}
