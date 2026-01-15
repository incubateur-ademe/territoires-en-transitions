import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'TAG_CREATE_ERROR',
  'TAG_UPDATE_ERROR',
  'TAG_DELETE_ERROR',
  'TAG_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const mutateTagErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    TAG_CREATE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La création du tag a échoué",
    },
    TAG_UPDATE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La mise à jour du tag a échoué",
    },
    TAG_DELETE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "La suppression du tag a échoué",
    },
    TAG_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "Le tag demandé n'existe pas",
    },
  },
};

export const MutateTagErrorEnum = createErrorsEnum(specificErrors);
export type MutateTagError = keyof typeof MutateTagErrorEnum;
