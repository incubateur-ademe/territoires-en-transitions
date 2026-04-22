import { Injectable, Logger } from '@nestjs/common';
import { GetUserRolesAndPermissionsService } from '@tet/backend/users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  createErrorsEnum,
  createTrpcErrorHandler,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { PermissionOperation, UserRolesAndPermissions } from '@tet/domain/users';
import { UserScope } from './scope';

const scopeFactoryErrors = ['USER_PERMISSIONS_NOT_FOUND'] as const;
type ScopeFactorySpecificError = (typeof scopeFactoryErrors)[number];

export const ScopeFactoryErrorEnum = createErrorsEnum(scopeFactoryErrors);
export type ScopeFactoryError = keyof typeof ScopeFactoryErrorEnum;

export const scopeFactoryErrorConfig: TrpcErrorHandlerConfig<ScopeFactorySpecificError> =
  {
    specificErrors: {
      USER_PERMISSIONS_NOT_FOUND: {
        code: 'FORBIDDEN',
        message: "Impossible de résoudre les permissions de l'utilisateur",
      },
    },
  };

export const getScopeOrThrow = createTrpcErrorHandler(scopeFactoryErrorConfig);

@Injectable()
export class ScopeFactory {
  private readonly logger = new Logger(ScopeFactory.name);

  constructor(
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService
  ) {}

  async fromAuthenticatedUser(
    user: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<UserScope, ScopeFactoryError>> {
    const permissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });

    if (!permissionsResult.success) {
      this.logger.warn(`Permissions introuvables pour l'utilisateur ${user.id}`);
      return failure(
        ScopeFactoryErrorEnum.USER_PERMISSIONS_NOT_FOUND,
        permissionsResult.error
      );
    }

    const permissions = restrictPermissionsToApiKeyIfAny(
      permissionsResult.data,
      user.jwtPayload.permissions
    );

    return success({
      kind: 'user',
      userId: user.id,
      permissions,
    });
  }
}

function restrictPermissionsToApiKeyIfAny(
  permissions: UserRolesAndPermissions,
  apiKeyPermissions: string[] | undefined
): UserRolesAndPermissions {
  if (!apiKeyPermissions) {
    return permissions;
  }
  const allowed = new Set(apiKeyPermissions);
  const isAllowed = (operation: PermissionOperation): boolean =>
    allowed.has(operation);

  return {
    ...permissions,
    permissions: permissions.permissions.filter(isAllowed),
    collectivites: permissions.collectivites.map((collectivite) => ({
      ...collectivite,
      permissions: collectivite.permissions.filter(isAllowed),
      audits: collectivite.audits.map((audit) => ({
        ...audit,
        permissions: audit.permissions.filter(isAllowed),
      })),
    })),
  };
}
