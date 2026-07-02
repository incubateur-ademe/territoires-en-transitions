import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'EMPTY_SERVICES_LIST',
  ...referentielModeGuardSpecificErrors,
] as const;
type SpecificError = (typeof specificErrors)[number];

export const handleMesureServicesErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      EMPTY_SERVICES_LIST: {
        code: 'BAD_REQUEST',
        message: 'La liste des services ne peut pas être vide.',
      },
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const HandleMesureServicesErrorEnum = createErrorsEnum(specificErrors);
export type HandleMesureServicesError =
  keyof typeof HandleMesureServicesErrorEnum;
