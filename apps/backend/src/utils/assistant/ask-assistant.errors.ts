import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'LLM_ERROR',
  'TOOLS_UNSUPPORTED',
  'TIMEOUT',
  'OPERATOR_NOT_FOUND',
  'OPERATOR_NOT_SUPPORT',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const askAssistantErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    LLM_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "Le modèle n'a pas pu répondre",
    },
    TOOLS_UNSUPPORTED: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        "Le fournisseur de modèle configuré ne sait pas appeler d'outils",
    },
    TIMEOUT: {
      code: 'TIMEOUT',
      message: "L'assistant n'a pas répondu dans le temps imparti",
    },
    OPERATOR_NOT_FOUND: {
      code: 'NOT_FOUND',
      message:
        "Aucun compte Territoires en Transitions avec l'e-mail de cet opérateur Crisp",
    },
    OPERATOR_NOT_SUPPORT: {
      code: 'FORBIDDEN',
      message:
        "Le compte Territoires en Transitions de cet opérateur n'a pas le rôle support",
    },
  },
};

export const AskAssistantErrorEnum = createErrorsEnum(specificErrors);
export type AskAssistantError = keyof typeof AskAssistantErrorEnum;
