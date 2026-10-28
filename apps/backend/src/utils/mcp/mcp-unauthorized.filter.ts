import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { McpResourceMetadataService } from './mcp-resource-metadata.service';

/**
 * Le guard global répond 401 sans en-tête. Un client MCP a besoin de
 * `WWW-Authenticate` pour trouver les métadonnées de la ressource, puis le
 * serveur d'autorisation (RFC 9728). Filtre posé sur le seul contrôleur MCP.
 */
@Injectable()
@Catch(UnauthorizedException)
export class McpUnauthorizedFilter implements ExceptionFilter {
  constructor(private readonly metadataService: McpResourceMetadataService) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const metadataUrl = this.metadataService.getMetadataUrl(req);

    res.setHeader(
      'WWW-Authenticate',
      `Bearer error="invalid_token", error_description="${exception.message}", resource_metadata="${metadataUrl}"`
    );
    res.status(401).json({
      error: 'invalid_token',
      error_description: exception.message,
    });
  }
}
