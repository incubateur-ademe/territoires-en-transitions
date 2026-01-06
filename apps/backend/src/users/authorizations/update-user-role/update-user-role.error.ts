import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['USER_NOT_SUPPORT'] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateUserRoleErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      USER_NOT_SUPPORT: {
        code: 'BAD_REQUEST',
        message:
          "L'utilisateur doit avoir le rôle support pour activer le mode support",
      },
    },
  };

export const UpdateUserRoleErrorEnum = createErrorsEnum(specificErrors);
export type UpdateUserRoleError = keyof typeof UpdateUserRoleErrorEnum;
