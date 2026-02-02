import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['DUPLICATE_NAME'] as const;
type SpecificError = (typeof specificErrors)[number];

export const instanceGouvernanceErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DUPLICATE_NAME: {
        code: 'CONFLICT',
        message:
          'Une instance de gouvernance avec ce nom existe déjà pour cette collectivité',
      },
    },
  };

export const instanceGouvernanceErrorEnum = createErrorsEnum(specificErrors);
export type InstanceGouvernanceError =
  keyof typeof instanceGouvernanceErrorEnum;
