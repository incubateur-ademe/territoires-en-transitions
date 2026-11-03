import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import VersionService from '@tet/backend/utils/version/version.service';
import { McpDocsService } from './mcp-docs.service';
import { McpTool } from './mcp-tool.interface';
import {
  MCP_INTERACTIVE_TOOLS,
  MCP_SERVER_NAME,
  MCP_TOOLS,
} from './mcp.constants';

/**
 * Un serveur MCP par requête, construit pour un utilisateur : les outils le
 * capturent et aucun état ne survit à la réponse (transport sans session).
 */
@Injectable()
export class BuildMcpServerService {
  constructor(
    @Inject(MCP_TOOLS) private readonly tools: McpTool[],
    @Inject(MCP_INTERACTIVE_TOOLS)
    private readonly interactiveTools: McpTool[],
    private readonly docsService: McpDocsService,
    private readonly versionService: VersionService
  ) {}

  /** `interactive` : l'assistant de l'app, qui sait afficher des choix et
   * faire confirmer une écriture. */
  build(
    user: AuthenticatedUser,
    { interactive = false }: { interactive?: boolean } = {}
  ): McpServer {
    const server = new McpServer({
      name: MCP_SERVER_NAME,
      version: this.versionService.getVersion().version ?? 'dev',
    });
    this.docsService.register(server);
    for (const tool of interactive
      ? [...this.tools, ...this.interactiveTools]
      : this.tools) {
      tool.register(server, user);
    }
    return server;
  }
}
