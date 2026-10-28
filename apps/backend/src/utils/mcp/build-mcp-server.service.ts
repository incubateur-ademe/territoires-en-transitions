import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Inject, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import VersionService from '@tet/backend/utils/version/version.service';
import { McpDocsService } from './mcp-docs.service';
import { McpTool } from './mcp-tool.interface';
import { MCP_SERVER_NAME, MCP_TOOLS } from './mcp.constants';

/**
 * Un serveur MCP par requête, construit pour un utilisateur : les outils le
 * capturent et aucun état ne survit à la réponse (transport sans session).
 */
@Injectable()
export class BuildMcpServerService {
  constructor(
    @Inject(MCP_TOOLS) private readonly tools: McpTool[],
    private readonly docsService: McpDocsService,
    private readonly versionService: VersionService
  ) {}

  build(user: AuthenticatedUser): McpServer {
    const server = new McpServer({
      name: MCP_SERVER_NAME,
      version: this.versionService.getVersion().version ?? 'dev',
    });
    this.docsService.register(server);
    for (const tool of this.tools) {
      tool.register(server, user);
    }
    return server;
  }
}
