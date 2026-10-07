import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'AVIS_DEJA_VALIDE',
  'TITRE_HORS_PERIMETRE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const upsertAvisErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMANDE_AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La demande d'avis n'a pas été trouvée",
    },
    AVIS_DEJA_VALIDE: {
      code: 'CONFLICT',
      message: 'Un avis validé ne peut plus être modifié',
    },
    TITRE_HORS_PERIMETRE: {
      code: 'FORBIDDEN',
      message: "Cet instructeur ne rend pas d'avis à ce titre",
    },
  },
};

export const UpsertAvisErrorEnum = createErrorsEnum(specificErrors);
export type UpsertAvisError = keyof typeof UpsertAvisErrorEnum;
