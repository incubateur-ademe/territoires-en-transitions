import {
  CollectiviteAccessLevel,
  PermissionOperation,
} from '@tet/domain/users';

export const accessLevelLabels: Record<CollectiviteAccessLevel, string> = {
  admin: 'Admin',
  edition: 'Éditeur',
  edition_fiches_indicateurs: 'Contributeur',
  lecture: 'Lecteur',
};

export function getAccessLevelLabel(accessLevel: CollectiviteAccessLevel) {
  return accessLevelLabels[accessLevel];
}

export const accessLevelDescriptions: Record<CollectiviteAccessLevel, string> =
  {
    admin: 'Peut entièrement configurer et éditer',
    edition: 'Peut éditer et inviter de nouveaux membres',
    edition_fiches_indicateurs:
      'Peut éditer uniquement les actions & indicateurs dont il est le pilote',
    lecture: 'Peut uniquement consulter',
  };

export function getAccessLevelDescription(
  accessLevel: CollectiviteAccessLevel
) {
  return accessLevelDescriptions[accessLevel];
}

export function hasPermission(
  permissions: PermissionOperation[] | undefined,
  permission: PermissionOperation
): boolean {
  return permissions?.includes(permission) || false;
}
