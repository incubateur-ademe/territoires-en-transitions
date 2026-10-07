import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { ActionsDeReferenceSpecificError } from './actions-de-reference.errors';

export const actionsDeReferenceErrorConfig: TrpcErrorHandlerConfig<ActionsDeReferenceSpecificError> =
  {
    specificErrors: {
      ACTION_DE_REFERENCE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'action de référence demandée n'existe pas",
      },
      ACTION_DE_REFERENCE_CONFLICT: {
        code: 'CONFLICT',
        message:
          'Une action de référence porte déjà ce titre pour ce levier et cette catégorie',
      },
    },
  };
