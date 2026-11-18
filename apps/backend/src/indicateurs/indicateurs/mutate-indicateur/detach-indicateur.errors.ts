import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['INDICATEUR_NOT_SOUS_INDICATEUR'] as const;
type SpecificError = (typeof specificErrors)[number];

export const detachIndicateurErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      INDICATEUR_NOT_SOUS_INDICATEUR: {
        code: 'BAD_REQUEST',
        message: "L'indicateur n'est le sous-indicateur d'aucun indicateur",
      },
    },
  };

export const DetachIndicateurErrorEnum = createErrorsEnum(specificErrors);
export type DetachIndicateurError = keyof typeof DetachIndicateurErrorEnum;
