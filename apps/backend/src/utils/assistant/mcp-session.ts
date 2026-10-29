import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { LlmToolDefinition } from '@tet/backend/utils/llm/llm-chat';

export type McpToolResult = { text: string; isError: boolean };

/**
 * Client MCP en mémoire sur le serveur construit pour l'utilisateur : l'agent
 * appelle exactement les outils, permissions et ressources que voit
 * Claude.ai, sans saut réseau ni seconde authentification.
 */
export class McpSession {
  private constructor(
    private readonly client: Client,
    private readonly server: McpServer
  ) {}

  static async open(server: McpServer): Promise<McpSession> {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'tet-assistant', version: '1.0.0' });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    return new McpSession(client, server);
  }

  async listTools(): Promise<LlmToolDefinition[]> {
    const { tools } = await this.client.listTools();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description ?? tool.title ?? tool.name,
      parameters: withoutSchemaKeyword(tool.inputSchema),
    }));
  }

  async callTool(
    name: string,
    args: Record<string, unknown>
  ): Promise<McpToolResult> {
    try {
      const result = await this.client.callTool({ name, arguments: args });
      const content = Array.isArray(result.content) ? result.content : [];
      const text = content
        .map((part) =>
          part && typeof part === 'object' && 'text' in part
            ? String(part.text)
            : ''
        )
        .join('\n');
      return { text, isError: Boolean(result.isError) };
    } catch (error) {
      // Arguments rejetés par le schéma de l'outil, outil inconnu : le
      // modèle reçoit l'erreur et peut corriger son appel.
      return {
        text: error instanceof Error ? error.message : String(error),
        isError: true,
      };
    }
  }

  /** Texte d'un prompt MCP, ressources embarquées comprises. */
  async getPromptText(
    name: string,
    args?: Record<string, string>
  ): Promise<string> {
    const { messages } = await this.client.getPrompt({
      name,
      arguments: args,
    });
    return messages
      .map((message) => {
        const content = message.content;
        if (content.type === 'text') {
          return content.text;
        }
        if (content.type === 'resource' && 'text' in content.resource) {
          return content.resource.text;
        }
        return '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  }

  async close(): Promise<void> {
    await this.client.close();
    await this.server.close();
  }
}

/** `$schema` en tête de JSON Schema : refusé par certains fournisseurs. */
const withoutSchemaKeyword = (
  schema: Record<string, unknown>
): Record<string, unknown> => {
  const { $schema: _ignored, ...rest } = schema;
  return rest;
};
