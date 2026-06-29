import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import type { CollectivitePreferencesError } from '../collectivite-preferences/collectivite-preferences.errors';

export type CollectiviteReferentielModeError = CollectivitePreferencesError;

export const referentielModeGuardSpecificErrors = [
  'REFERENTIEL_NOT_WRITABLE',
] as const;

export const referentielNotWritableTrpcErrorEntry = {
  REFERENTIEL_NOT_WRITABLE: {
    code: 'FORBIDDEN',
    message: 'Ce référentiel est en lecture seule et ne peut pas être modifié.',
  },
} as const;

export const REFERENTIEL_NOT_WRITABLE_MESSAGE =
  referentielNotWritableTrpcErrorEntry.REFERENTIEL_NOT_WRITABLE.message;

type ReferentielModeGuardSpecificError =
  (typeof referentielModeGuardSpecificErrors)[number];

export const referentielModeGuardErrorConfig: TrpcErrorHandlerConfig<ReferentielModeGuardSpecificError> =
  {
    specificErrors: referentielNotWritableTrpcErrorEntry,
  };

export const ReferentielModeGuardErrorEnum = createErrorsEnum(
  referentielModeGuardSpecificErrors
);
export type ReferentielModeGuardError =
  keyof typeof ReferentielModeGuardErrorEnum;

export type ReferentielNotWritableError =
  typeof ReferentielModeGuardErrorEnum.REFERENTIEL_NOT_WRITABLE;
