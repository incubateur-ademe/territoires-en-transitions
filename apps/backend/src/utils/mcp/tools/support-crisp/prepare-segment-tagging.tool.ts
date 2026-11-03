import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  MAX_TAGGED_CONVERSATIONS,
  prepareSegmentTaggingInputSchema,
  prepareSegmentTaggingOutputSchema,
  PrepareSegmentTaggingService,
} from './prepare-segment-tagging.service';

export const PREPARE_SEGMENT_TAGGING_TOOL = 'prepare_segment_tagging';

const DESCRIPTION = `Prépare l'ajout d'un segment Crisp aux conversations d'un filtre (sujet de segment et/ou termes cherchés dans les messages, période), sans rien écrire : renvoie le nombre de conversations concernées, un aperçu et les segments existants proches. L'utilisateur confirme ensuite avec le bouton affiché dans l'assistant ; toi, tu ne peux pas écrire.

Le filtre décrit les conversations à étiqueter : ne pas y mettre le segment à ajouter (celles qui l'ont déjà sont exclues d'office). Si conversations vaut 0, il n'y a rien à confirmer : le dire et proposer d'élargir le filtre.

Réservé au rôle support. Au plus ${MAX_TAGGED_CONVERSATIONS} conversations. Avant de l'appeler, vérifier avec list_support_segments que le segment existe ; si segmentExistant est faux, proposer les segmentsProches à l'utilisateur.`;

/** Outil de l'assistant de l'app seulement : la confirmation y a un bouton. */
@Injectable()
export class PrepareSegmentTaggingTool implements McpTool {
  constructor(
    private readonly prepareSegmentTaggingService: PrepareSegmentTaggingService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      PREPARE_SEGMENT_TAGGING_TOOL,
      {
        title: "Préparer l'ajout d'un segment Crisp",
        description: DESCRIPTION,
        inputSchema: prepareSegmentTaggingInputSchema,
        outputSchema: prepareSegmentTaggingOutputSchema,
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      async (input) =>
        toToolResult(
          await this.prepareSegmentTaggingService.run(input, { user })
        )
    );
  }
}
