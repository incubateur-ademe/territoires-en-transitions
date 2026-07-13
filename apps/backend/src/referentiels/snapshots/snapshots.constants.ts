import { SnapshotJalon, SnapshotJalonEnum } from '@tet/domain/referentiels';

export const SNAPSHOTS = {
  SCORE_COURANT_REF: 'score-courant',
  SCORE_COURANT_NOM: 'Score courant',
  PRE_AUDIT_REF_PREFIX: 'pre-audit-',
  PRE_AUDIT_NOM_SUFFIX: ' - avant audit ',
  POST_AUDIT_REF_PREFIX: 'post-audit-',
  POST_AUDIT_NOM_SUFFIX: ' - audit ',
  JOUR_REF_PREFIX: 'jour-',
  SCORE_PERSONNALISE_REF_PREFIX: 'user-',
  JOUR_NOM_PREFIX: ' - jour du ',
  PRE_SWITCH_TE_REF: 'pre-switch-te',
  PRE_SWITCH_TE_NOM: 'État pré-bascule Climat Ressources',
} as const;

export const USER_MUTABLE_SNAPSHOT_JALONS: readonly SnapshotJalon[] = [
  SnapshotJalonEnum.DATE_PERSONNALISEE,
];

export const USER_MUTABLE_SNAPSHOT_JALONS_LABEL =
  USER_MUTABLE_SNAPSHOT_JALONS.join(', ');
