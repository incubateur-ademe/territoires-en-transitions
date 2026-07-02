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

export const snapshotsErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    ...referentielNotWritableTrpcErrorEntry,
  },
};

export const SnapshotsErrorEnum = createErrorsEnum(specificErrors);
export type SnapshotsError = keyof typeof SnapshotsErrorEnum;
