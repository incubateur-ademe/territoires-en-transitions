import {
  referentielModeGuardSpecificErrors,
  referentielNotWritableTrpcErrorEntry,
} from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  createErrorsEnum,
  TrpcErrorHandlerConfig,
} from '@tet/backend/utils/trpc/trpc-error-handler';
import { USER_MUTABLE_SNAPSHOT_JALONS } from './snapshots.constants';

const snapshotSpecificErrors = [
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
] as const;
type SpecificError = (typeof specificErrors)[number];

export const snapshotsTrpcErrorEntries = {
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
} as const;

export const snapshotsErrorConfig: TrpcErrorHandlerConfig<SpecificError> = {
  specificErrors: snapshotsTrpcErrorEntries,
};

export const SnapshotsErrorEnum = createErrorsEnum(specificErrors);
export type SnapshotsError = keyof typeof SnapshotsErrorEnum;
