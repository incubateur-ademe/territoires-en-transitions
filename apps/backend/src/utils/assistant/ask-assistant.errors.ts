import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = ['LLM_ERROR', 'TOOLS_UNSUPPORTED', 'TIMEOUT'] as const;
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
  },
};

export const AskAssistantErrorEnum = createErrorsEnum(specificErrors);
export type AskAssistantError = keyof typeof AskAssistantErrorEnum;
