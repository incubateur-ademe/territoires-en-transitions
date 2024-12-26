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
import BackendConfigurationService from '../../utils/config/configuration.service';
import { getErrorMessage } from '../../utils/nest/errors.utils';
import { AllowAnonymousAccess } from '../decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../decorators/allow-public-access.decorator';
import {
  AuthJwtPayload,
  AuthUser,
  isAnonymousUser,
  isAuthenticatedUser,
  isServiceRoleUser,
  jwtToUser,
} from '../models/auth.models';

export const TOKEN_QUERY_PARAM = 'token';
export const REQUEST_JWT_PAYLOAD_PARAM = 'jwt-payload';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
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

    // Validate JWT token and extract payload
    let jwtPayload: AuthJwtPayload;
    try {
      jwtPayload = await this.jwtService.verifyAsync<AuthJwtPayload>(jwtToken, {
        secret: this.backendConfigurationService.get('SUPABASE_JWT_SECRET'),
      });
    } catch (err) {
      this.logger.error(`Failed to validate token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }

    // Convert JWT payload to user
    let user: AuthUser;
    try {
      user = jwtToUser(jwtPayload);
    } catch (err) {
      this.logger.error(`Failed to convert token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }

    // 💡 We're assigning the user to the request object here so that we can access it in our route handlers
    // @ts-expect-error force attach a new property to the request object
    request[REQUEST_JWT_PAYLOAD_PARAM] = user;

    if (isAuthenticatedUser(user)) {
      this.logger.log(`Authenticated user is allowed`);
      return true;
    }

    if (isServiceRoleUser(user)) {
      this.logger.log(`Service role user is allowed`);
      return true;
    }

    if (isAnonymousUser(user)) {
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

    this.logger.error(`Unknown user is not allowed`);
    throw new UnauthorizedException();
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    if (request.query[TOKEN_QUERY_PARAM]) {
      return request.query[TOKEN_QUERY_PARAM] as string;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
