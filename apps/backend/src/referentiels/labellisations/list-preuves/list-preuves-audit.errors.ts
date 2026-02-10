import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'UNAUTHORIZED',
  'AUDIT_NOT_FOUND',
  'DATABASE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const listPreuvesAuditErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        message:
          "Vous n'avez pas les permissions nécessaires pour lister les preuves de cet audit.",
      },
      AUDIT_NOT_FOUND: {
        code: 'BAD_REQUEST',
        message:
          'Aucun audit trouvé pour cette collectivité et ce référentiel.',
      },
      DATABASE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message:
          "Une erreur de base de données s'est produite lors de la récupération des preuves de cet audit.",
      },
    },
  };

export const ListPreuvesAuditErrorEnum = createErrorsEnum(specificErrors);
export type ListPreuvesAuditError = keyof typeof ListPreuvesAuditErrorEnum;
