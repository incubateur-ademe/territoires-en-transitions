import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'ACTION_NOT_FOUND',
  'FICHE_NOT_FOUND',
  'FICHE_COLLECTIVITE_MISMATCH',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateActionFichesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ACTION_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'action référentielle demandée n'existe pas",
      },
      FICHE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Au moins une fiche fournie n'existe pas",
      },
      FICHE_COLLECTIVITE_MISMATCH: {
        code: 'BAD_REQUEST',
        message:
          'Les fiches fournies doivent toutes appartenir à la même collectivité',
      },
    },
  };

export const UpdateActionFichesErrorEnum = createErrorsEnum(specificErrors);
export type UpdateActionFichesError = keyof typeof UpdateActionFichesErrorEnum;
