import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

export const MutateMembresSpecificErrors = ['MEMBER_NOT_FOUND'] as const;
export type MutateMembresError =
  (typeof MutateMembresSpecificErrors)[number];

export const mutateMembresErrorConfig: TrpcErrorHandlerConfig<MutateMembresError> =
  {
    specificErrors: {
      MEMBER_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Ce membre n'est pas rattaché à cette collectivité",
      },
    },
  };

export const MutateMembresErrorEnum = createErrorsEnum(
  MutateMembresSpecificErrors
);
