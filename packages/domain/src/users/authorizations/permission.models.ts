import { PermissionOperation } from './permission-operation.enum.schema';
import {
  AuditRole,
  CollectiviteRole,
  PlatformRole,
  UserRole,
} from './user-role.enum.schema';

const visiteurVerifiePermissions: readonly PermissionOperation[] = [
  'collectivites.read',
  'collectivites.documents.read',
  'referentiels.read',
  'plans.read',
  'plans.fiches.read',
  'indicateurs.indicateurs.read',
  'indicateurs.valeurs.read',
];

const collectiviteLecturePermissions: readonly PermissionOperation[] = [
  ...visiteurVerifiePermissions,

  'collectivites.read_confidentiel',
  'collectivites.documents.read_confidentiel',
  'collectivites.membres.read',
  'collectivites.tags.read',
  'referentiels.read_confidentiel',
  'referentiels.discussions.read',
  'referentiels.discussions.mutate',
  'plans.read_confidentiel',
  'plans.fiches.read_confidentiel',
  'plans.export',
  'indicateurs.indicateurs.read_confidentiel',
  'indicateurs.valeurs.read_confidentiel',
];

const collectiviteEditionPermissions: readonly PermissionOperation[] = [
  ...collectiviteLecturePermissions,

  'collectivites.membres.mutate',
  'collectivites.tags.mutate',
  'collectivites.documents.create',
  'referentiels.mutate',
  'referentiels.labellisations.request',
  'plans.mutate',
  'plans.fiches.create',
  'plans.fiches.update',
  'plans.fiches.bulk_update',
  'plans.fiches.delete',
  'indicateurs.indicateurs.create',
  'indicateurs.indicateurs.update',
  'indicateurs.indicateurs.delete',
  'indicateurs.valeurs.mutate',
];

const collectiviteAdminPermissions: readonly PermissionOperation[] = [
  ...collectiviteEditionPermissions,

  'collectivites.tableau-de-bord.mutate',
];

export const permissionsByRole: Record<UserRole, PermissionOperation[]> = {
  [PlatformRole.CONNECTED]: [],
  [PlatformRole.VERIFIED]: [...visiteurVerifiePermissions],
  [PlatformRole.SUPPORT]: ['users.authorizations.mutate_super_admin_role'],
  [PlatformRole.SUPER_ADMIN]: [
    ...collectiviteAdminPermissions,

    'collectivites.mutate',
    'plans.fiches.import',
  ],
  [PlatformRole.ADEME]: [
    ...visiteurVerifiePermissions,

    'referentiels.discussions.read',

    'indicateurs.indicateurs.read_confidentiel',
    'indicateurs.valeurs.read_confidentiel',
  ],
  [CollectiviteRole.LECTURE]: [...collectiviteLecturePermissions],
  [CollectiviteRole.EDITION]: [...collectiviteEditionPermissions],
  [CollectiviteRole.ADMIN]: [...collectiviteAdminPermissions],
  [CollectiviteRole.EDITION_FICHES_INDICATEURS]: [
    ...collectiviteLecturePermissions.filter(
      (p) => p !== 'plans.read' && p !== 'plans.read_confidentiel'
    ),

    'plans.fiches.update_piloted_by_me',
    'indicateurs.indicateurs.update_piloted_by_me',
    'indicateurs.valeurs.mutate_piloted_by_me',

    'collectivites.tags.mutate',
    'collectivites.documents.create',
  ],
  [AuditRole.AUDITEUR]: [
    ...collectiviteLecturePermissions,

    'referentiels.audit',
    'referentiels.mutate',

    'collectivites.documents.create',
    'indicateurs.indicateurs.create',
    'indicateurs.indicateurs.update',
    'indicateurs.indicateurs.delete',
    'indicateurs.valeurs.mutate',
  ],
};
