import { collectivitePreferencesTrpcErrorEntries } from '@tet/backend/collectivites/collectivite-preferences/collectivite-preferences.errors';
import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import { failure, type Result } from '@tet/backend/utils/result.type';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { USER_MUTABLE_SNAPSHOT_JALONS } from './snapshots.constants';

const snapshotSpecificErrors = [
  'COLLECTIVITE_NOT_FOUND',
  'SNAPSHOT_NOT_FOUND',
  'SNAPSHOT_NAME_UPDATE_FORBIDDEN',
  'SNAPSHOT_JALON_MISMATCH',
  'SNAPSHOT_REF_ALREADY_EXISTS',
  'SNAPSHOT_DELETION_FORBIDDEN',
  'SNAPSHOT_INVALID_METADATA',
  'SNAPSHOT_SAVE_FAILED',
] as const;

const specificErrors = [
  ...snapshotSpecificErrors,
  ...referentielModeGuardSpecificErrors,
  'PREFERENCES_PARSE_ERROR',
] as const;
type SpecificError = (typeof specificErrors)[number];

export const snapshotsTrpcErrorEntries = {
  COLLECTIVITE_NOT_FOUND: {
    code: 'NOT_FOUND',
    message: "Cette collectivité n'existe pas",
  },
  SNAPSHOT_NOT_FOUND: {
    code: 'NOT_FOUND',
    message:
      "Aucun snapshot de score avec la référence demandée n'a été trouvé",
  },
  SNAPSHOT_NAME_UPDATE_FORBIDDEN: {
    code: 'BAD_REQUEST',
    message: `Seuls les noms des snapshots de type ${USER_MUTABLE_SNAPSHOT_JALONS.join(
      ', '
    )} peuvent être modifiés`,
  },
  SNAPSHOT_JALON_MISMATCH: {
    code: 'BAD_REQUEST',
    message:
      'Impossible de mettre à jour le snapshot de score car le type de jalon est différent',
  },
  SNAPSHOT_REF_ALREADY_EXISTS: {
    code: 'BAD_REQUEST',
    message:
      'Un snapshot de score avec la référence demandée existe déjà pour cette collectivité et ce référentiel',
  },
  SNAPSHOT_DELETION_FORBIDDEN: {
    code: 'FORBIDDEN',
    message: `Uniquement les snapshots de type ${USER_MUTABLE_SNAPSHOT_JALONS.join(
      ', '
    )} peuvent être supprimés par un utilisateur.`,
  },
  SNAPSHOT_INVALID_METADATA: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Les métadonnées du snapshot sont invalides',
  },
  SNAPSHOT_SAVE_FAILED: {
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Impossible de sauvegarder le snapshot de score',
  },
  ...referentielNotWritableTrpcErrorEntry,
  PREFERENCES_PARSE_ERROR:
    collectivitePreferencesTrpcErrorEntries.PREFERENCES_PARSE_ERROR,
} as const;

export const snapshotsErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: snapshotsTrpcErrorEntries,
};

export const SnapshotsErrorEnum = createErrorsEnum(specificErrors);
export type SnapshotsError = keyof typeof SnapshotsErrorEnum;

export type SnapshotsErrorMapping<T extends string> = {
  snapshotNotFound?: T;
  snapshotConflict?: T;
  snapshotSaveFailed?: T;
  defaultError: T;
};

/** mappe un échec SnapshotsService vers le code d'erreur de l'orchestrateur appelant */
export function mapSnapshotsError<T extends string>(
  result: Result<unknown, SnapshotsError>,
  mapping: SnapshotsErrorMapping<T>
): Result<never, T> {
  if (result.success) {
    throw new Error('mapSnapshotsError called with a successful result');
  }

  const { error, cause } = result;

  if (
    error === SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND &&
    mapping.snapshotNotFound
  ) {
    return failure(mapping.snapshotNotFound, cause);
  }

  if (
    (error === SnapshotsErrorEnum.SNAPSHOT_REF_ALREADY_EXISTS ||
      error === SnapshotsErrorEnum.SNAPSHOT_JALON_MISMATCH) &&
    mapping.snapshotConflict
  ) {
    return failure(mapping.snapshotConflict, cause);
  }

  if (
    (error === SnapshotsErrorEnum.SNAPSHOT_SAVE_FAILED ||
      error === SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA) &&
    mapping.snapshotSaveFailed
  ) {
    return failure(mapping.snapshotSaveFailed, cause);
  }

  return failure(mapping.defaultError, cause);
}
