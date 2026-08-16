import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'AVIS_VALIDE_SANS_PIECE_JOINTE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const upsertAvisErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    DEMANDE_AVIS_NOT_FOUND: {
      code: 'NOT_FOUND',
      message: "La demande d'avis n'a pas été trouvée",
    },
    AVIS_VALIDE_SANS_PIECE_JOINTE: {
      code: 'CONFLICT',
      message: 'Un avis validé doit conserver sa pièce jointe',
    },
  },
};

export const UpsertAvisErrorEnum = createErrorsEnum(specificErrors);
export type UpsertAvisError = keyof typeof UpsertAvisErrorEnum;
