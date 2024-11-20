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
import BackendConfigurationService from '../../config/configuration.service';
import { getErrorMessage } from '../../common/services/errors.helper';
import { AllowAnonymousAccess } from '../decorators/allow-anonymous-access.decorator';
import { AllowPublicAccess } from '../decorators/allow-public-access.decorator';
import { AuthenticatedUser } from '../models/authenticated-user.models';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
    private backendConfigurationService: BackendConfigurationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const allowPublicAccess = this.reflector.get(
      AllowPublicAccess,
      context.getHandler()
    );

    if (allowPublicAccess) {
      this.logger.log(`Public endpoint`);
      return true;
    }

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const user: AuthenticatedUser = await this.jwtService.verifyAsync(token, {
        secret: this.backendConfigurationService.get('SUPABASE_JWT_SECRET'),
      });
      // 💡 We're assigning the user to the request object here
      // so that we can access it in our route handlers
      request['user'] = user;

      this.logger.log(`Token validated for user ${user.id}`);

      if (user.is_anonymous) {
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

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
