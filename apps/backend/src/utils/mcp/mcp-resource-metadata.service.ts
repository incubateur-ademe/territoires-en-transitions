import { Injectable } from '@nestjs/common';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import type { Request } from 'express';
import {
  MCP_PROTECTED_RESOURCE_METADATA_PATH,
  MCP_RESOURCE_PATH,
} from './mcp.constants';

/** Métadonnées de ressource protégée OAuth 2.0 (RFC 9728). */
export type McpProtectedResourceMetadata = {
  resource: string;
  authorization_servers: string[];
  bearer_methods_supported: string[];
  scopes_supported: string[];
};

const LOCAL_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

@Injectable()
export class McpResourceMetadataService {
  constructor(private readonly configService: ConfigurationService) {}

  /**
   * Origine publique de l'API : `BACKEND_PUBLIC_URL`, posée par le déploiement.
   * L'en-tête Host n'est repris qu'en local : il vient du client, et un Host
   * forgé enverrait les clients MCP vers un serveur d'autorisation arbitraire.
   */
  getBaseUrl(req: Request): string {
    const configured = this.configService.get('BACKEND_PUBLIC_URL');
    if (configured) {
      return configured.replace(/\/+$/, '');
    }
    const host = req.headers.host ?? 'localhost';
    if (!LOCAL_HOST_PATTERN.test(host)) {
      throw new Error(
        'BACKEND_PUBLIC_URL doit être définie hors environnement local'
      );
    }
    return `http://${host}`;
  }

  getResourceUrl(req: Request): string {
    return `${this.getBaseUrl(req)}${MCP_RESOURCE_PATH}`;
  }

  getMetadataUrl(req: Request): string {
    return `${this.getBaseUrl(req)}${MCP_PROTECTED_RESOURCE_METADATA_PATH}`;
  }

  getMetadata(req: Request): McpProtectedResourceMetadata {
    const supabaseUrl = this.configService
      .get('SUPABASE_URL')
      .replace(/\/+$/, '');
    return {
      resource: this.getResourceUrl(req),
      authorization_servers: [`${supabaseUrl}/auth/v1`],
      bearer_methods_supported: ['header'],
      scopes_supported: [],
    };
  }
}
