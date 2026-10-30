import { INestApplication } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { BuildMcpServerService } from '@tet/backend/utils/mcp/build-mcp-server.service';
import {
  MCP_ANALYSE_STATS_PROMPT_NAME,
  MCP_ESQUISSE_PROMPT_NAME,
  MCP_SUPPORT_PROMPT_NAME,
} from '@tet/backend/utils/mcp/mcp-docs.service';
import { createHash } from 'node:crypto';
import { McpSession } from '../mcp-session';

export type AssistantVersions = {
  promptVersion: string;
  toolsetVersion: string;
  toolNames: string[];
};

const shortHash = (value: string): string =>
  createHash('sha256').update(value).digest('hex').slice(0, 12);

/**
 * Empreintes de ce que voit le modèle : prompts système et outils du serveur
 * MCP. `baseline.json` garde celles de la dernière éval ; si elles bougent, il
 * faut relancer l'éval avant de mettre la baseline à jour.
 */
export const computeAssistantVersions = async (
  app: INestApplication,
  user: AuthenticatedUser
): Promise<AssistantVersions> => {
  const session = await McpSession.open(
    app.get(BuildMcpServerService).build(user)
  );
  try {
    const prompts = [
      await session.getPromptText(MCP_ANALYSE_STATS_PROMPT_NAME),
      await session.getPromptText(MCP_ESQUISSE_PROMPT_NAME, {
        sujet: '{sujet}',
      }),
      await session.getPromptText(MCP_SUPPORT_PROMPT_NAME),
    ];
    const tools = (await session.listTools()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    return {
      promptVersion: shortHash(prompts.join('\n')),
      toolsetVersion: shortHash(JSON.stringify(tools)),
      toolNames: tools.map((tool) => tool.name),
    };
  } finally {
    await session.close();
  }
};
