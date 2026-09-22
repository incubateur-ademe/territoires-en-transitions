import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { PertinenceLeviersSpecificError } from './pertinence-leviers.errors';

export const pertinenceLeviersErrorConfig: TrpcErrorHandlerConfig<PertinenceLeviersSpecificError> =
  {
    specificErrors: {
      LIST_PERTINENCES_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La lecture de la pertinence des leviers a échoué',
      },
      UPSERT_PERTINENCE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'enregistrement de la pertinence du levier a échoué",
      },
      COLLECTIVITE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La collectivité demandée n'existe pas",
      },
    },
  };
