import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const importTrajectoireSnbc3SpecificErrors = [
  'SNBC3_REPOSITORY_UNREACHABLE',
  'SNBC3_ARTIFACT_NOT_FOUND',
  'SNBC3_ARTIFACT_INVALID',
  'SNBC3_PARQUET_SCHEMA_INVALID',
  'SNBC3_WORKBOOK_STORAGE_ERROR',
  'SNBC3_IMPORT_ALREADY_RUNNING',
  'SNBC3_PARTIAL_IMPORT_RELEASE_MISMATCH',
] as const;

type ImportTrajectoireSnbc3SpecificError =
  (typeof importTrajectoireSnbc3SpecificErrors)[number];

export const importTrajectoireSnbc3ErrorConfig: TrpcErrorHandlerConfig<ImportTrajectoireSnbc3SpecificError> =
  {
    specificErrors: {
      SNBC3_REPOSITORY_UNREACHABLE: {
        code: 'BAD_GATEWAY',
        message: 'Le dépôt snbc3 ne répond pas, ou refuse l’accès',
      },
      SNBC3_ARTIFACT_NOT_FOUND: {
        code: 'NOT_FOUND',
        message:
          'Le commit, la release ou un de ses fichiers est introuvable dans le dépôt snbc3',
      },
      SNBC3_ARTIFACT_INVALID: {
        code: 'PRECONDITION_FAILED',
        message:
          'La release snbc3 ne correspond pas à son manifeste (version, taille ou empreinte)',
      },
      SNBC3_PARQUET_SCHEMA_INVALID: {
        code: 'PRECONDITION_FAILED',
        message:
          'Le parquet snbc3 ne contient pas les colonnes attendues : le contrat de sortie a changé',
      },
      SNBC3_WORKBOOK_STORAGE_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: "L'enregistrement du classeur snbc3 dans le stockage a échoué",
      },
      SNBC3_IMPORT_ALREADY_RUNNING: {
        code: 'CONFLICT',
        message: 'Un import SNBC 3 est déjà en cours ou en attente',
      },
      SNBC3_PARTIAL_IMPORT_RELEASE_MISMATCH: {
        code: 'PRECONDITION_FAILED',
        message:
          'Un rejeu partiel (collectiviteIds) ne porte que sur la release du dernier import complet : importer d’abord cette release sans filtre',
      },
    },
  };

export const ImportTrajectoireSnbc3ErrorEnum = createErrorsEnum(
  importTrajectoireSnbc3SpecificErrors
);
export type ImportTrajectoireSnbc3Error =
  keyof typeof ImportTrajectoireSnbc3ErrorEnum;
