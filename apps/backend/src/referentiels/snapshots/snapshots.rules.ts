import { toSlug } from '@tet/backend/utils/string.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { SnapshotJalon, SnapshotJalonEnum } from '@tet/domain/referentiels';
import { SNAPSHOTS, USER_MUTABLE_SNAPSHOT_JALONS } from './snapshots.constants';
import { SnapshotsErrorEnum, type SnapshotsError } from './snapshots.errors';

export function canUserMutateSnapshot(jalon: SnapshotJalon): boolean {
  return USER_MUTABLE_SNAPSHOT_JALONS.includes(jalon);
}

export function getDefaultSnapshotMetadata({
  nom: snapshotNom,
  jalon,
  anneeAudit,
}: {
  nom?: string;
  jalon?: SnapshotJalon;
  anneeAudit?: number;
}): Result<{ ref: string; nom: string }, SnapshotsError> {
  let ref = '';
  let nom = snapshotNom || '';

  if (
    (jalon === SnapshotJalonEnum.PRE_AUDIT ||
      jalon === SnapshotJalonEnum.POST_AUDIT) &&
    !anneeAudit
  ) {
    return failure(
      SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA,
      new Error(`L'année de l'audit doit être définie pour le jalon ${jalon}`)
    );
  }

  switch (jalon) {
    case SnapshotJalonEnum.PRE_AUDIT:
      ref = `${SNAPSHOTS.PRE_AUDIT_REF_PREFIX}${anneeAudit}`;
      nom = `${anneeAudit}${SNAPSHOTS.PRE_AUDIT_NOM_SUFFIX}`;
      break;

    case SnapshotJalonEnum.POST_AUDIT:
      ref = `${SNAPSHOTS.POST_AUDIT_REF_PREFIX}${anneeAudit}`;
      nom = `${anneeAudit}${SNAPSHOTS.POST_AUDIT_NOM_SUFFIX}`;
      break;

    case SnapshotJalonEnum.COURANT:
      ref = nom
        ? `${SNAPSHOTS.SCORE_PERSONNALISE_REF_PREFIX}${toSlug(nom)}`
        : SNAPSHOTS.SCORE_COURANT_REF;
      nom = nom || SNAPSHOTS.SCORE_COURANT_NOM;
      break;

    case SnapshotJalonEnum.DATE_PERSONNALISEE:
      ref = nom ? toSlug(nom) : '';
      break;

    case SnapshotJalonEnum.PRE_SWITCH_TE:
      ref = SNAPSHOTS.PRE_SWITCH_TE_REF;
      nom = SNAPSHOTS.PRE_SWITCH_TE_NOM;
      break;

    default:
      return failure(
        SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA,
        new Error(`Un nom de snapshot doit être défini pour le jalon ${jalon}`)
      );
  }

  ref = ref.slice(0, 30);

  if (!nom || !ref) {
    return failure(
      SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA,
      new Error(`Un nom de snapshot doit être défini pour le jalon ${jalon}`)
    );
  }

  return success({ ref, nom });
}
