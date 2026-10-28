import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  Controller,
  Delete,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UseFilters,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AllowPublicAccess } from '@tet/backend/users/decorators/allow-public-access.decorator';
import { TokenInfo } from '@tet/backend/users/decorators/token-info.decorators';
import {
  type AuthUser,
  isAuthenticatedUser,
} from '@tet/backend/users/models/auth.models';
import { ApiUsageEnum } from '@tet/backend/utils/api/api-usage-type.enum';
import { ApiUsage } from '@tet/backend/utils/api/api-usage.decorator';
import { ResourceType } from '@tet/domain/users';
import type { Request, Response } from 'express';
import { BuildMcpServerService } from './build-mcp-server.service';
import { McpUnauthorizedFilter } from './mcp-unauthorized.filter';

const METHOD_NOT_ALLOWED = {
  jsonrpc: '2.0',
  error: { code: -32000, message: 'Method not allowed.' },
  id: null,
};

const INTERNAL_ERROR = {
  jsonrpc: '2.0',
  error: { code: -32603, message: 'Internal server error' },
  id: null,
};

/**
 * Serveur MCP « Streamable HTTP » sans session : chaque POST reçoit son
 * propre serveur et son propre transport, ce qui tient avec plusieurs
 * instances derrière un répartiteur de charge.
 *
 * L'authentification est celle du guard global (JWT Supabase : session
 * utilisateur, jeton OAuth émis par Supabase ou jeton de clé API) ; l'accès
 * est réservé aux utilisateurs humains porteurs de `utils.mcp.read`.
 */
@ApiExcludeController()
@UseFilters(McpUnauthorizedFilter)
@Controller('mcp')
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(
    private readonly buildMcpServerService: BuildMcpServerService,
    private readonly permissionService: PermissionService
  ) {}

  @Post()
  // Une conversation enchaîne plusieurs appels d'outils : plus large que le
  // défaut global, sans le désactiver.
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiUsage([ApiUsageEnum.EXTERNAL_API])
  async handle(
    @TokenInfo() user: AuthUser,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    // Un jeton service_role passe le guard et contourne toute vérification
    // de permission : seul un utilisateur identifié peut interroger le MCP.
    if (!isAuthenticatedUser(user)) {
      res.status(403).json({
        error: 'forbidden',
        error_description: 'Un utilisateur authentifié est requis',
      });
      return;
    }

    const allowed = await this.permissionService.isAllowed(
      user,
      'utils.mcp.read',
      ResourceType.PLATEFORME,
      null
    );
    if (!allowed.success) {
      res.status(403).json({
        error: 'forbidden',
        error_description: "L'accès au serveur MCP est réservé à l'équipe",
      });
      return;
    }

    const server = this.buildMcpServerService.build(user);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      this.logger.error(`MCP request failed: ${error}`);
      if (!res.headersSent) {
        res.status(500).json(INTERNAL_ERROR);
      }
    }
  }

  @AllowPublicAccess()
  @Get()
  rejectGet(@Res() res: Response): void {
    res.status(405).json(METHOD_NOT_ALLOWED);
  }

  @AllowPublicAccess()
  @Delete()
  rejectDelete(@Res() res: Response): void {
    res.status(405).json(METHOD_NOT_ALLOWED);
  }
}
