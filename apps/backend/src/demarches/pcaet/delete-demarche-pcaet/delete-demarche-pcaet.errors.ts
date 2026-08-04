import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMARCHE_PCAET_NOT_FOUND',
  'DEMARCHE_NON_SUPPRIMABLE',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const deleteDemarchePcaetErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMARCHE_PCAET_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La démarche PCAET demandée n'a pas été trouvée",
      },
      DEMARCHE_NON_SUPPRIMABLE: {
        code: 'CONFLICT',
        message:
          'Une démarche transmise ou publiée ne peut pas être supprimée',
      },
    },
  };

export const DeleteDemarchePcaetErrorEnum = createErrorsEnum(specificErrors);
export type DeleteDemarchePcaetError =
  keyof typeof DeleteDemarchePcaetErrorEnum;
