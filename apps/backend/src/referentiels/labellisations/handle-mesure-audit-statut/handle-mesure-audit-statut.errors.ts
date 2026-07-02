import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [...referentielModeGuardSpecificErrors] as const;
type SpecificError = (typeof specificErrors)[number];

export const handleMesureAuditStatutErrorConfig: TrpcErrorHandlerConfig<SpecificError> =
  {
    specificErrors: {
      ...referentielNotWritableTrpcErrorEntry,
    },
  };

export const HandleMesureAuditStatutErrorEnum =
  createErrorsEnum(specificErrors);
export type HandleMesureAuditStatutError =
  keyof typeof HandleMesureAuditStatutErrorEnum;
