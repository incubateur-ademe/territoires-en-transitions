import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import ConfigurationService from '../utils/config/configuration.service';
import { getErrorMessage } from '../utils/nest/errors.utils';
import { AuthJwtPayload, AuthUser, jwtToUser } from './models/auth.models';

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
}
