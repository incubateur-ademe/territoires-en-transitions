import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['MIXED_REFERENTIELS'] as const;
type SpecificError = (typeof specificErrors)[number];

export const scoreIndicatifErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      MIXED_REFERENTIELS: {
        code: 'BAD_REQUEST',
        message:
          "Les actions fournies appartiennent à plusieurs référentiels différents. Veuillez fournir des actions d'un seul référentiel.",
      },
    },
  };

export const ScoreIndicatifErrorEnum = createErrorsEnum(specificErrors);
export type ScoreIndicatifError = keyof typeof ScoreIndicatifErrorEnum;
