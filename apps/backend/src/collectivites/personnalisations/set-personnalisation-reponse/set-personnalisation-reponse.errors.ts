import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'QUESTION_NOT_FOUND',
  'UNSUPPORTED_QUESTION_TYPE',
  'INVALID_RESPONSE_TYPE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const setPersonnalisationReponseErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      QUESTION_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La question demandée n'existe pas",
      },
      UNSUPPORTED_QUESTION_TYPE: {
        code: 'BAD_REQUEST',
        message: 'Type de question non supporté',
      },
      INVALID_RESPONSE_TYPE: {
        code: 'BAD_REQUEST',
        message: 'Réponse non valide pour cette question',
      },
    },
  };

export const SetPersonnalisationReponseErrorEnum =
  createErrorsEnum(specificErrors);
export type SetPersonnalisationReponseError =
  keyof typeof SetPersonnalisationReponseErrorEnum;
