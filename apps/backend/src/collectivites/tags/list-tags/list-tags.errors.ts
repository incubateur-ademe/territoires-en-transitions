import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LIST_TAGS_ERROR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const listTagsErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    LIST_TAGS_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'La récupération de la liste des tags a échoué',
    },
  },
};

export const ListTagsErrorEnum = createErrorsEnum(specificErrors);
export type ListTagsError = keyof typeof ListTagsErrorEnum;
