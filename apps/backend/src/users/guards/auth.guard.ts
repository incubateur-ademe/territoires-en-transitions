import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ContextStoreService } from '../../utils/context/context.service';
import { ConvertJwtToAuthUserService } from '../convert-jwt-to-auth-user.service';
import { AllowAnonymousAccess } from '../decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../decorators/allow-public-access.decorator';
import {
  isAnonymousUser,
  isAuthenticatedUser,
  isServiceRoleUser,
} from '../models/auth.models';

export const TOKEN_QUERY_PARAM = 'token';
export const REQUEST_JWT_PAYLOAD_PARAM = 'jwt-payload';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private reflector: Reflector,
    private contextStoreService: ContextStoreService,
    private convertJwtToAuthUserService: ConvertJwtToAuthUserService
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

    const user = await this.convertJwtToAuthUserService.convertJwtToAuthUser(
      jwtToken
    );

    this.contextStoreService.updateContext({
      apiClientId: user.jwtPayload.client_id || undefined,
      userId: user.id || undefined,
      authRole: user.role,
    });

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
      throw new UnauthorizedException('Anonymous user is not allowed');
    }

    this.logger.error(`Unknown user is not allowed`);
    throw new UnauthorizedException('Unknown user is not allowed');
  }

  private extractTokenFromRequest(request: Request): string | undefined {
    if (request.query[TOKEN_QUERY_PARAM]) {
      return request.query[TOKEN_QUERY_PARAM] as string;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
