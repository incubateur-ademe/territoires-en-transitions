import { CollectiviteAccessLevel, PermissionOperation } from '@/domain/users';

export const accessLevelLabels: Record<CollectiviteAccessLevel, string> = {
  admin: 'Admin',
  edition: 'Éditeur complet',
  edition_fiches_indicateurs: 'Éditeur actions & indicateurs',
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
      'Peut consulter et éditer les actions et indicateurs dont il est pilote',
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
