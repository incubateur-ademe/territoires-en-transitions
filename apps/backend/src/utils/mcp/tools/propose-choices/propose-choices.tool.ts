import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { McpTool } from '../../mcp-tool.interface';
import { READ_ONLY_TOOL_ANNOTATIONS } from '../shared/read-only-annotations';

export const PROPOSE_CHOICES_TOOL = 'propose_choices';

export const proposeChoicesInputSchema = z.object({
  question: z
    .string()
    .min(3)
    .max(300)
    .describe("La question à poser à l'utilisateur, courte"),
  options: z
    .array(z.string().min(1).max(120))
    .min(2)
    .max(6)
    .describe(
      "Réponses possibles, concrètes et distinctes (ex. des segments existants, des périodes) ; l'utilisateur peut aussi écrire autre chose"
    ),
});
export type ProposeChoicesInput = z.infer<typeof proposeChoicesInputSchema>;

/**
 * Outil d'interface de l'assistant de l'app : affiche des choix cliquables et
 * termine le tour. Rien n'est lu ni écrit.
 */
@Injectable()
export class ProposeChoicesTool implements McpTool {
  register(server: McpServer): void {
    server.registerTool(
      PROPOSE_CHOICES_TOOL,
      {
        title: "Proposer des choix à l'utilisateur",
        description:
          "Quand la demande est ambiguë (sujet, segment, période, collectivité…), affiche une question et 2 à 6 réponses cliquables au lieu de deviner. Termine ton tour : l'utilisateur répondra au message suivant. Une seule question à la fois.",
        inputSchema: proposeChoicesInputSchema,
        annotations: READ_ONLY_TOOL_ANNOTATIONS,
      },
      async () => ({
        content: [
          {
            type: 'text',
            text: "Choix affichés à l'utilisateur : attends sa réponse.",
          },
        ],
      })
    );
  }
}
