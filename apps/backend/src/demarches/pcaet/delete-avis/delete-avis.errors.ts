import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'AVIS_NOT_FOUND',
  'AVIS_VALIDE_NON_SUPPRIMABLE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const deleteAvisErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMANDE_AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La demande d'avis n'a pas été trouvée",
    },
    AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "L'avis n'a pas été trouvé",
    },
    AVIS_VALIDE_NON_SUPPRIMABLE: {
      code: 'CONFLICT',
      message: 'Un avis validé ne peut pas être supprimé',
    },
  },
};

export const DeleteAvisErrorEnum = createErrorsEnum(specificErrors);
export type DeleteAvisError = keyof typeof DeleteAvisErrorEnum;
