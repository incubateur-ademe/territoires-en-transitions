import { Controller, Get, Req } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AllowPublicAccess } from '@tet/backend/users/decorators/allow-public-access.decorator';
import type { Request } from 'express';
import { McpResourceMetadataService } from './mcp-resource-metadata.service';

/**
 * Découverte OAuth des clients MCP (RFC 9728). Les deux chemins sont servis :
 * le client essaie d'abord celui suffixé du chemin de la ressource, puis la
 * racine. Ils sont exclus du préfixe global dans `main.ts`.
 */
@ApiExcludeController()
@Controller('.well-known')
export class McpProtectedResourceMetadataController {
  constructor(private readonly metadataService: McpResourceMetadataService) {}

  @AllowPublicAccess()
  @Get('oauth-protected-resource')
  getMetadata(@Req() req: Request) {
    return this.metadataService.getMetadata(req);
  }

  @AllowPublicAccess()
  @Get('oauth-protected-resource/api/v1/mcp')
  getMetadataForMcpResource(@Req() req: Request) {
    return this.metadataService.getMetadata(req);
  }
}
