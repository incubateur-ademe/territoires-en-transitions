import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { PreuvesArchiveSpecificError } from './preuves-archive.errors';

/** `ARCHIVE_NOT_FOUND` couvre aussi l'anti-énumération (archive d'un·e autre utilisateur·ice). */
export const preuvesArchiveErrorConfig: TrpcErrorHandlerConfig<PreuvesArchiveSpecificError> =
  {
    specificErrors: {
      CREATE_ARCHIVE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "La création de l'archive de preuves a échoué",
      },
      GET_ARCHIVE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "La lecture de l'archive de preuves a échoué",
      },
      UPDATE_ARCHIVE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "La mise à jour de l'archive de preuves a échoué",
      },
      ARCHIVE_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "L'archive de preuves demandée n'existe pas",
      },
      AUDIT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "Aucun audit en cours pour ce référentiel",
      },
      ARCHIVE_STATUS_PARSE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "Le statut de l'archive de preuves est invalide",
      },
      COLLECT_PREUVES_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'La collecte des preuves a échoué',
      },
    },
  };
