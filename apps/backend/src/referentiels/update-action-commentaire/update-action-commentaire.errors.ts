import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['ACTION_NOT_FOUND'] as const;
type SpecificError = (typeof specificErrors)[number];

export const updateActionCommentaireErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ACTION_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'action demandée n'existe pas pour ce référentiel.",
      },
    },
  };

export const UpdateActionCommentaireErrorEnum =
  createErrorsEnum(specificErrors);
export type UpdateActionCommentaireError =
  keyof typeof UpdateActionCommentaireErrorEnum;
