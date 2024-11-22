import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { getErrorMessage } from '../../common/services/errors.helper';
import BackendConfigurationService from '../../config/configuration.service';
import { AllowAnonymousAccess } from '../decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../decorators/allow-public-access.decorator';
import {
  AuthenticatedUser,
  AuthJwtPayload,
  isAnonymousJwt,
  jwtToAuthenticatedUser,
} from '../models/auth.models';
import SupabaseService from '../../common/services/supabase.service';

export const TOKEN_QUERY_PARAM = 'token';
export const REQUEST_JWT_PAYLOAD_PARAM = 'jwt-payload';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private supabase: SupabaseService,
    private reflector: Reflector,
    private backendConfigurationService: BackendConfigurationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();

    const allowPublicAccess = this.reflector.get(
      AllowPublicAccess,
      context.getHandler()
    );

    if (allowPublicAccess) {
      this.logger.log(`Public endpoint`);
      return true;
    }

    const jwtToken = this.extractTokenFromRequest(request);
    if (!jwtToken) {
      throw new UnauthorizedException();
    }

    let jwtPayload;
    try {
      jwtPayload = await this.jwtService.verifyAsync<AuthJwtPayload>(jwtToken, {
        secret: this.backendConfigurationService.get('SUPABASE_JWT_SECRET'),
      });
    } catch (err) {
      this.logger.error(`Failed to validate token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }

    if (isAnonymousJwt(jwtPayload)) {
      const allowAnonymousAccess = this.reflector.get(
        AllowAnonymousAccess,
        context.getHandler()
      );

      if (allowAnonymousAccess) {
        this.logger.log(`Anonymous user is allowed`);
        return true;
      }

      this.logger.error(`Anonymous user is not allowed`);
      throw new UnauthorizedException();
    }

    // Else user is authenticated
    // const { data } = await this.supabase.client.auth.getUser(jwtToken);

    let authenticatedUser: AuthenticatedUser;
    try {
      authenticatedUser = jwtToAuthenticatedUser(jwtPayload);
      this.logger.log(`Token validated for user ${authenticatedUser.id}`);
    } catch (err) {
      this.logger.error(`Failed to convert token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }

    // 💡 We're assigning the payload to the request object here so that we can access it in our route handlers
    // @ts-expect-error force attach a new property to the request object
    request[REQUEST_JWT_PAYLOAD_PARAM] = authenticatedUser;

    return true;
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    if (request.query[TOKEN_QUERY_PARAM]) {
      return request.query[TOKEN_QUERY_PARAM] as string;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
