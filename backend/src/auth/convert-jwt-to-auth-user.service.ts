import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ConfigurationService from '../utils/config/configuration.service';
import { getErrorMessage } from '../utils/nest/errors.utils';
import { AuthJwtPayload, AuthRole, AuthUser } from './models/auth.models';

@Injectable()
export class ConvertJwtToAuthUserService {
  private readonly logger = new Logger(ConvertJwtToAuthUserService.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigurationService
  ) {}

  async convertJwtToAuthUser(jwt: string) {
    // Validate JWT token and extract payload
    let jwtPayload: AuthJwtPayload;
    try {
      jwtPayload = await this.jwtService.verifyAsync<AuthJwtPayload>(jwt, {
        secret: this.config.get('SUPABASE_JWT_SECRET'),
      });
    } catch (err) {
      this.logger.error(`Failed to validate token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }

    // Convert JWT payload to user
    let user: AuthUser;
    try {
      user = {
        ...jwtToUser(jwtPayload),
        jwt,
      };
    } catch (err) {
      this.logger.error(`Failed to convert token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }

    return user;
  }
}

function jwtToUser(jwtPayload: AuthJwtPayload) {
  if (jwtPayload.role === AuthRole.AUTHENTICATED) {
    if (jwtPayload.sub === undefined) {
      throw new Error(
        `JWT sub claim is missing: ${JSON.stringify(jwtPayload)}`
      );
    }

    return {
      id: jwtPayload.sub,
      role: AuthRole.AUTHENTICATED,
      isAnonymous: false,
      jwtPayload,
    };
  }

  if (jwtPayload.role === AuthRole.ANON) {
    return {
      id: null,
      role: AuthRole.ANON,
      isAnonymous: true,
      jwtPayload,
    };
  }

  if (jwtPayload.role === AuthRole.SERVICE_ROLE) {
    return {
      id: null,
      role: AuthRole.SERVICE_ROLE,
      isAnonymous: true,
      jwtPayload,
    };
  }

  throw new Error(`JWT role is invalid: ${JSON.stringify(jwtPayload)}`);
}
