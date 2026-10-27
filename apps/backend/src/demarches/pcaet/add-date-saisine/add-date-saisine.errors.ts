import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'DEPOT_TRANSMIS_SUR_PLATEFORME',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const addDateSaisineErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      DEMANDE_AVIS_NOT_FOUND: {
        code: 'NOT_FOUND',
        message: "La demande d'avis n'a pas été trouvée",
      },
      DEPOT_TRANSMIS_SUR_PLATEFORME: {
        code: 'CONFLICT',
        message:
          "La date de saisine d'un dépôt transmis sur la plateforme est celle de sa transmission",
      },
    },
  };

export const AddDateSaisineErrorEnum = createErrorsEnum(specificErrors);
export type AddDateSaisineError = keyof typeof AddDateSaisineErrorEnum;
