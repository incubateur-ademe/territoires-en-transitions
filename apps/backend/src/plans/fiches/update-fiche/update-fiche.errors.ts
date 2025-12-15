import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'SELF_REFERENCE',
  'PARENT_NOT_FOUND',
  'FICHE_NOT_FOUND',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateFicheErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    SELF_REFERENCE: {
      code: 'BAD_REQUEST',
      message: "L'action ne peut pas se référencer elle-même",
    },
    PARENT_NOT_FOUND: {
      code: 'BAD_REQUEST',
      message: "L'action ne peut pas référencer une action inexistante",
    },
    FICHE_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: 'Action non trouvée',
    },
  },
};

export const UpdateFicheErrorEnum = createErrorsEnum(specificErrors);
export type UpdateFicheError = keyof typeof UpdateFicheErrorEnum;
