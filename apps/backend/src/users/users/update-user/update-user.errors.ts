import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['USER_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateUserErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    USER_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "L'utilisateur demandé n'existe pas.",
    },
  },
};

export const UpdateUserErrorEnum = createErrorsEnum(specificErrors);
export type UpdateUserError = keyof typeof UpdateUserErrorEnum;
