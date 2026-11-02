import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { McpTool, toToolResult } from '../../mcp-tool.interface';
import {
  getReferentielScoresInputSchema,
  getReferentielScoresOutputSchema,
  GetReferentielScoresService,
} from './get-referentiel-scores.service';

@Injectable()
export class GetReferentielScoresTool implements McpTool {
  constructor(
    private readonly getReferentielScoresService: GetReferentielScoresService
  ) {}

  register(server: McpServer, user: AuthenticatedUser): void {
    server.registerTool(
      'get_referentiel_scores',
      {
        title: "Score courant d'une collectivité sur un référentiel",
        description:
          "Points fait, programmé, pas fait et potentiel du score courant d'une collectivité sur un référentiel (cae, eci ou te), avec les pourcentages de complétion et de réalisation et le nombre d'étoiles. Si le score n'est pas à jour, il est recalculé et enregistré comme dans l'app.",
        inputSchema: getReferentielScoresInputSchema,
        outputSchema: getReferentielScoresOutputSchema,
        // Le recalcul éventuel écrit un snapshot : lecture du point de vue
        // métier, mais pas strictement sans effet.
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input) =>
        toToolResult(
          await this.getReferentielScoresService.run(input, { user })
        )
    );
  }
}
