import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['FICHE_NOT_FOUND', 'ETAPE_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const ficheActionEtapeErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    commonErrors: {
      UNAUTHORIZED: { code: 'FORBIDDEN', messageFromCause: true },
    },
    specificErrors: {
      FICHE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La fiche action demandée n'existe pas",
      },
      ETAPE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'étape demandée n'existe pas",
      },
    },
  };

export const FicheActionEtapeErrorEnum = createErrorsEnum(specificErrors);
export type FicheActionEtapeError = keyof typeof FicheActionEtapeErrorEnum;
