import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getErrorMessage } from '@tet/domain/utils';
import { verify } from 'jsonwebtoken';
import ConfigurationService from '../utils/config/configuration.service';
import { AuthJwtPayload, AuthUser, jwtToUser } from './models/auth.models';
import { SupabaseSigningKeysService } from './supabase-signing-keys.service';

const ASYMMETRIC_ALGORITHMS = ['ES256', 'RS256'] as const;
type AsymmetricAlgorithm = (typeof ASYMMETRIC_ALGORITHMS)[number];

const isAsymmetricAlgorithm = (alg: unknown): alg is AsymmetricAlgorithm =>
  ASYMMETRIC_ALGORITHMS.includes(alg as AsymmetricAlgorithm);

@Injectable()
export class ConvertJwtToAuthUserService {
  private readonly logger = new Logger(ConvertJwtToAuthUserService.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigurationService,
    private signingKeys: SupabaseSigningKeysService
  ) {}

  async convertJwtToAuthUser(jwt: string) {
    // Validate JWT token and extract payload
    let jwtPayload: AuthJwtPayload;
    try {
      jwtPayload = await this.verify(jwt);
    } catch (err) {
      this.logger.error(`Failed to validate token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException(err);
    }

    // Convert JWT payload to user
    let user: AuthUser;
    try {
      user = jwtToUser(jwtPayload);
    } catch (err) {
      this.logger.error(`Failed to convert token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException(err);
    }

    return user;
  }

  /**
   * Supabase signe les sessions avec une clé asymétrique une fois ses clés de
   * signature migrées ; le secret HS256 reste valable pour les jetons émis
   * avant, les clés `anon` et `service_role`, et ceux que le backend signe
   * lui-même (clés d'API, tests). L'algorithme imposé à la vérification
   * suit la clé choisie : un jeton ne peut pas faire passer une clé publique
   * pour un secret HMAC.
   */
  private async verify(jwt: string): Promise<AuthJwtPayload> {
    const header = this.jwtService.decode<{
      header?: { alg?: unknown; kid?: unknown };
    } | null>(jwt, { complete: true })?.header;

    if (header?.alg === 'HS256') {
      return this.jwtService.verifyAsync<AuthJwtPayload>(jwt, {
        secret: this.config.get('SUPABASE_JWT_SECRET'),
        algorithms: ['HS256'],
      });
    }

    if (isAsymmetricAlgorithm(header?.alg) && typeof header.kid === 'string') {
      const publicKey = await this.signingKeys.getPublicKey(header.kid);
      if (!publicKey) {
        throw new Error(`Unknown signing key: ${header.kid}`);
      }
      // Pas `jwtService` : le secret enregistré sur le module passe avant la
      // clé publique fournie à l'appel.
      return verify(jwt, publicKey, {
        algorithms: [header.alg],
      }) as AuthJwtPayload;
    }

    throw new Error(`Unsupported token algorithm: ${String(header?.alg)}`);
  }
}
