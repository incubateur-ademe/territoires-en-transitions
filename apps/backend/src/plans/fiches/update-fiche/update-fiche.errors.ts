import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'SELF_REFERENCE',
  'PARENT_NOT_FOUND',
  'PARENT_COLLECTIVITE_MISMATCH',
  'FICHE_NOT_FOUND',
  'INSTANCE_GOUVERNANCE_COLLECTIVITE_MISMATCH',
  'INSTANCE_GOUVERNANCE_TAG_NOT_FOUND',
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
    PARENT_COLLECTIVITE_MISMATCH: {
      code: 'BAD_REQUEST',
      message:
        "La sous-action doit appartenir à la même collectivité que la fiche parente",
    },
    FICHE_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: 'Action non trouvée',
    },
    INSTANCE_GOUVERNANCE_COLLECTIVITE_MISMATCH: {
      code: 'BAD_REQUEST',
      message:
        "L'instance de gouvernance n'appartient pas à la même collectivité que la fiche",
    },
    INSTANCE_GOUVERNANCE_TAG_NOT_FOUND: {
      code: 'BAD_REQUEST',
      message: "Une ou plusieurs instances de gouvernance n'existent pas",
    },
  },
};

export const UpdateFicheErrorEnum = createErrorsEnum(specificErrors);
export type UpdateFicheError = keyof typeof UpdateFicheErrorEnum;
