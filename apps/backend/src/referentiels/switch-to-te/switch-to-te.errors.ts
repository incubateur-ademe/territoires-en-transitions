import {
  collectivitePreferencesSpecificErrors,
  collectivitePreferencesTrpcErrorEntries,
} from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';

const specificErrors = [
  'REFERENTIEL_TE_DISABLED',
  'ALREADY_SWITCHED',
  'NOT_ELIGIBLE',
  'COT_ACTIVE',
  'AUDIT_REQUEST_IN_PROGRESS',
  'AUDIT_IN_PROGRESS',
  'SWITCH_NOT_IMPLEMENTED',
  'PRE_SWITCH_SNAPSHOT_FAILED',
  ...collectivitePreferencesSpecificErrors,
] as const;

export const switchToTeTrpcErrorEntries = {
  REFERENTIEL_TE_DISABLED: {
    code: 'FORBIDDEN',
    message: "Le référentiel TE n'est pas activé pour cette collectivité",
  },
  ALREADY_SWITCHED: {
    code: 'CONFLICT',
    message: 'La bascule vers TE a déjà été effectuée',
  },
  NOT_ELIGIBLE: {
    code: 'BAD_REQUEST',
    message:
      "Cette collectivité n'est pas éligible à la bascule (TE non en lecture seule ou aucun référentiel CAE/ECI engagé)",
  },
  COT_ACTIVE: {
    code: 'FORBIDDEN',
    message:
      "La bascule n'est pas possible : un contrat d'objectif (COT) est actif pour cette collectivité",
  },
  AUDIT_REQUEST_IN_PROGRESS: {
    code: 'CONFLICT',
    message:
      "La bascule n'est pas possible : une demande d'audit est en cours sur un référentiel CAE/ECI",
  },
  AUDIT_IN_PROGRESS: {
    code: 'CONFLICT',
    message:
      "La bascule n'est pas possible : un audit est en cours sur un référentiel CAE/ECI",
  },
  SWITCH_NOT_IMPLEMENTED: {
    code: 'NOT_IMPLEMENTED',
    message: "La bascule n'est pas encore disponible",
  },
  PRE_SWITCH_SNAPSHOT_FAILED: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Impossible de créer le snapshot pré-bascule',
  },
} as const;

type SpecificError = (typeof specificErrors)[number];

export const switchToTeErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: {
    ...switchToTeTrpcErrorEntries,
    ...collectivitePreferencesTrpcErrorEntries,
  },
};

export const SwitchToTeErrorEnum = createErrorsEnum(specificErrors);
export type SwitchToTeError = keyof typeof SwitchToTeErrorEnum;
