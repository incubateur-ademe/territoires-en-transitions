import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'DEMANDE_AVIS_NOT_FOUND',
  'DEPOT_TRANSMIS_SUR_PLATEFORME',
  'DATE_SAISINE_HORS_BORNES',
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
      DATE_SAISINE_HORS_BORNES: {
        code: 'BAD_REQUEST',
        message:
          'La date de saisine doit être comprise entre le 1er janvier 1900 et aujourd’hui',
      },
    },
  };

export const AddDateSaisineErrorEnum = createErrorsEnum(specificErrors);
export type AddDateSaisineError = keyof typeof AddDateSaisineErrorEnum;
