import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'AVIS_NOT_FOUND',
  'AVIS_SANS_PIECE_JOINTE',
  'PARTIES_NON_VALIDEES',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const validerAvisErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMANDE_AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La demande d'avis n'a pas été trouvée",
    },
    AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "L'avis n'a pas été trouvé",
    },
    AVIS_SANS_PIECE_JOINTE: {
      code: 'CONFLICT',
      message: 'Un avis ne peut pas être validé sans pièce jointe',
    },
    PARTIES_NON_VALIDEES: {
      code: 'CONFLICT',
      message:
        "Les trois parties de l'instruction doivent être validées avant de valider un avis",
    },
  },
};

export const ValiderAvisErrorEnum = createErrorsEnum(specificErrors);
export type ValiderAvisError = keyof typeof ValiderAvisErrorEnum;
