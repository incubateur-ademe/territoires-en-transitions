import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST_JWT_PAYLOAD_PARAM } from '../../users/guards/auth.guard';
import { AuthUser } from '../../users/models/auth.models';

export const PARTNER_PLANS_READ_PERMISSION = 'partner.plans.read';

@Injectable()
export class PartnerPermissionGuard implements CanActivate {
  private readonly logger = new Logger(PartnerPermissionGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request[REQUEST_JWT_PAYLOAD_PARAM];

    if (!user) {
      throw new UnauthorizedException('Missing authentication');
    }

    const permissions = user.jwtPayload.permissions;

    if (
      !permissions ||
      !permissions.includes(PARTNER_PLANS_READ_PERMISSION)
    ) {
      this.logger.warn(
        `Access denied: missing permission ${PARTNER_PLANS_READ_PERMISSION}`
      );
      throw new ForbiddenException(
        `Permission ${PARTNER_PLANS_READ_PERMISSION} is required`
      );
    }

    return true;
  }
}
