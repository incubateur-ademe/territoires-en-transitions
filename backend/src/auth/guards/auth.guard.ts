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
import { SupabaseJwtPayload } from '../models/supabase-jwt.models';

export const TOKEN_QUERY_PARAM = 'token';

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

    const token = this.extractTokenFromRequest(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload: SupabaseJwtPayload = await this.jwtService.verifyAsync(
        token,
        {
          secret: this.backendConfigurationService.get('SUPABASE_JWT_SECRET'),
        }
      );
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      // @ts-expect-error tokenInfo doesn't exist on Request, but we want to attach it
      request['tokenInfo'] = payload;
      this.logger.log(`Token validated for user ${payload.sub}`);
      if (payload.is_anonymous) {
        const allowAnonymousAccess = this.reflector.get(
          AllowAnonymousAccess,
          context.getHandler()
        );
        if (allowAnonymousAccess) {
          this.logger.log(`Anonymous user is allowed`);
          return true;
        } else {
          this.logger.error(`Anonymous user is not allowed`);
          throw new UnauthorizedException();
        }
      }
    } catch (err) {
      this.logger.error(`Failed to validate token: ${getErrorMessage(err)}`);
      throw new UnauthorizedException();
    }
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
