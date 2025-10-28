import { PermissionLevel } from '@/domain/users';

export const permissionLevelLabels: Record<PermissionLevel, string> = {
  admin: 'Admin',
  edition: 'Éditeur complet',
  edition_fiches_indicateurs: 'Éditeur actions & indicateurs',
  lecture: 'Lecteur',
};

export function getPermissionLevelLabel(permissionLevel: PermissionLevel) {
  return permissionLevelLabels[permissionLevel];
}

export const permissionLevelDescriptions: Record<PermissionLevel, string> = {
  admin: 'Peut entièrement configurer et éditer',
  edition: 'Peut éditer et inviter de nouveaux membres',
  edition_fiches_indicateurs:
    'Peut consulter et éditer les actions et indicateurs dont il est pilote',
  lecture: 'Peut uniquement consulter',
};

export function getPermissionLevelDescription(permissionLevel: PermissionLevel) {
  return permissionLevelDescriptions[permissionLevel];
}