import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import { FICHE_ACTION_PDF_EXPORT_CONFIG } from './fiche-action-pdf-export.config';

type SpecificError =
  | 'NO_FICHES'
  | 'RENDER_ERROR'
  | 'INTERNAL_ERROR'
  | 'TOO_MANY_FICHES';

export const ficheActionPdfExportErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    NO_FICHES: {
      code: 'BAD_REQUEST',
      message: 'Aucune fiche accessible pour les critères donnés',
    },
    RENDER_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur de rendu PDF',
    },
    INTERNAL_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: "Erreur interne lors de l'export PDF",
    },
    TOO_MANY_FICHES: {
      code: 'PAYLOAD_TOO_LARGE',
      message: `L'export est limité à ${FICHE_ACTION_PDF_EXPORT_CONFIG.maxFiches} fiches.`,
    },
  },
};
