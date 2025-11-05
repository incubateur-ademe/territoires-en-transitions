import { GenerateApiKeyRequest } from '@/backend/users/apikeys/generate-api-key.request';
import { GenerateApiKeyResponse } from '@/backend/users/apikeys/generate-api-key.response';
import { GenerateTokenRequest } from '@/backend/users/apikeys/generate-token.request';
import { GenerateTokenResponse } from '@/backend/users/apikeys/generate-token.response';
import { userApiKeyTable } from '@/backend/users/apikeys/user-api-keys.table';
import { authUsersTable } from '@/backend/users/models/auth-users.table';
import {
  AuthJwtPayload,
  AuthRole,
  AuthUser,
} from '@/backend/users/models/auth.models';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { UserApiKeyCreate } from '@/domain/users';
import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserAppMetadata } from '@supabase/supabase-js';
import argon2 from 'argon2';
import { eq, getTableColumns } from 'drizzle-orm';
import { omit } from 'es-toolkit';
import crypto from 'node:crypto';

@Injectable()
export class ApikeysService {
  private readonly logger = new Logger(ApikeysService.name);

  private readonly CLIENT_ID_PREFIX = 'cid_';
  private readonly CLIENT_SECRET_PREFIX = 'csk_';
  private readonly CLIENT_SECRET_TRUNCATED_LENGTH = 4;

  constructor(
    private databaseService: DatabaseService,
    private jwtService: JwtService
  ) {}

  private async hashClientSecret(clientSecret: string): Promise<string> {
    /**
     * Using argon2 to hash the client secret (recommended over bcrypt).
     * For supabase implementation, see https://github.com/supabase/auth/blob/4beb1af98f0eab788e15d2c0cbb1090984032385/internal/crypto/password.go#L20
     */
    return await argon2.hash(clientSecret);
  }

  private checkIfRightUserOrServiceRole(
    user: AuthUser,
    forUserId: string
  ): boolean {
    return (
      user.role === AuthRole.SERVICE_ROLE ||
      (user.role === AuthRole.AUTHENTICATED && user.id === forUserId)
    );
  }

  async delete(user: AuthUser, clientId: string) {
    const apiKey = await this.getApiKeyInfo(clientId);

    if (
      !apiKey.users?.id ||
      !this.checkIfRightUserOrServiceRole(user, apiKey.users.id)
    ) {
      throw new ForbiddenException(
        `User ${user.id} is not authorized to delete an API key for user ${apiKey.users?.id}`
      );
    }

    await this.databaseService.db
      .delete(userApiKeyTable)
      .where(eq(userApiKeyTable.clientId, clientId));
  }

  async list(user: AuthUser) {
    const query = this.databaseService.db
      .select({
        ...omit(getTableColumns(userApiKeyTable), ['clientSecretHash']),
      })
      .from(userApiKeyTable);
    if (user.role === AuthRole.AUTHENTICATED && user.id) {
      return await query.where(eq(userApiKeyTable.userId, user.id));
    } else {
      return await query;
    }
  }

  async create(user: AuthUser, request: GenerateApiKeyRequest) {
    if (!this.checkIfRightUserOrServiceRole(user, request.userId)) {
      throw new ForbiddenException(
        `User ${user.id} is not authorized to generate an API key for user ${request.userId}`
      );
    }

    const clientId = `${this.CLIENT_ID_PREFIX}${crypto
      .randomBytes(20)
      .toString('hex')}`;
    const clientSecret = `${this.CLIENT_SECRET_PREFIX}${crypto
      .randomBytes(48)
      .toString('hex')}`;

    const clientSecretHash = await this.hashClientSecret(clientSecret);

    const userApiKey: UserApiKeyCreate = {
      userId: request.userId,
      clientId,
      clientSecretHash: clientSecretHash,
      clientSecretTruncated: clientSecret.substring(
        clientSecret.length - this.CLIENT_SECRET_TRUNCATED_LENGTH
      ),
      permissions: request.permissions || null,
    };

    const [insertedUserApiKey] = await this.databaseService.db
      .insert(userApiKeyTable)
      .values(userApiKey)
      .returning();

    this.logger.log(`Generated clientId: ${clientId} for user: ${user.id}`);

    const generateApiKeyResponse: GenerateApiKeyResponse = {
      userId: insertedUserApiKey.userId,
      clientId: insertedUserApiKey.clientId,
      clientSecret: clientSecret,
      permissions: insertedUserApiKey.permissions,
    };

    return generateApiKeyResponse;
  }

  private async getApiKeyInfo(clientId: string) {
    const userApiKeys = await this.databaseService.db
      .select()
      .from(userApiKeyTable)
      .leftJoin(authUsersTable, eq(userApiKeyTable.userId, authUsersTable.id))
      .where(eq(userApiKeyTable.clientId, clientId))
      .limit(1);

    if (!userApiKeys?.length) {
      throw new UnauthorizedException(`Invalid clientId: ${clientId}`);
    }

    return userApiKeys[0];
  }

  private async checkClientSecret(
    clientSecret: string,
    clientSecretHash: string,
    doNotThrow?: boolean
  ): Promise<boolean> {
    const isValidClientSecret = await argon2.verify(
      clientSecretHash,
      clientSecret
    );
    if (!isValidClientSecret && !doNotThrow) {
      throw new UnauthorizedException(`Invalid client secret`);
    }
    if (isValidClientSecret) {
      this.logger.log(`Client secret is valid`);
    } else {
      this.logger.warn(`Client secret is invalid`);
    }

    return isValidClientSecret;
  }

  async generateToken(
    request: GenerateTokenRequest,
    host: string
  ): Promise<GenerateTokenResponse> {
    const apiKeyInfo = await this.getApiKeyInfo(request.client_id);

    if (!apiKeyInfo.users) {
      throw new UnauthorizedException(
        `Invalid clientId: ${request.client_id} - user not found`
      );
    }

    await this.checkClientSecret(
      request.client_secret,
      apiKeyInfo.user_api_key.clientSecretHash
    );

    const appMetadata =
      apiKeyInfo.users.rawAppMetaData || ({} as UserAppMetadata);

    const fullHost = `https://${host}`;
    const payload: AuthJwtPayload = {
      aud: fullHost,
      iss: fullHost,
      role: AuthRole.AUTHENTICATED,
      sub: apiKeyInfo.user_api_key.userId,
      email: apiKeyInfo.users.email || undefined,
      phone: apiKeyInfo.users.phone || undefined,
      app_metadata: appMetadata,
      client_id: request.client_id,
      permissions: apiKeyInfo.user_api_key.permissions || undefined,
      is_anonymous: apiKeyInfo.users.isAnonymous || false,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    this.logger.log(`Generated access token for user: ${payload.sub}`);

    const response: GenerateTokenResponse = {
      token_type: 'Bearer',
      access_token: accessToken,
    };

    // Decode to get expires in
    const decodedToken = this.jwtService.decode(accessToken, {
      json: true,
      complete: true,
    });
    const decodedTokenPayload = decodedToken.payload as AuthJwtPayload;
    if (decodedTokenPayload.exp && decodedTokenPayload.iat) {
      const expiresIn = decodedTokenPayload.exp - decodedTokenPayload.iat;
      response.expires_in = expiresIn;
    }

    return response;
  }
}
