import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'CREATE_DEMARCHE_PCAET_ERROR',
  'DEMARCHE_EN_COURS_EXISTANTE',
  'SET_PILOTES_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const createDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_EN_COURS_EXISTANTE: {
        code: 'CONFLICT',
        message: 'Une démarche PCAET est déjà en cours pour cette collectivité',
      },
      CREATE_DEMARCHE_PCAET_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de la création de la démarche PCAET',
      },
      SET_PILOTES_ERROR: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erreur lors de l’écriture des pilotes de la démarche PCAET',
      },
    },
  };

export const CreateDemarchePcaetErrorEnum = createErrorsEnum(specificErrors);
export type CreateDemarchePcaetError =
  keyof typeof CreateDemarchePcaetErrorEnum;
