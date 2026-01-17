import { CollectiviteRole } from '@tet/domain/users';

export const accessLevelLabels: Record<CollectiviteRole, string> = {
  admin: 'Admin',
  edition: 'Éditeur',
  edition_fiches_indicateurs: 'Contributeur',
  lecture: 'Lecteur',
};

export function getAccessLevelLabel(accessLevel: CollectiviteRole) {
  return accessLevelLabels[accessLevel];
}

export const accessLevelDescriptions: Record<CollectiviteRole, string> = {
  admin: 'Peut entièrement configurer et éditer',
  edition: 'Peut éditer et inviter de nouveaux membres',
  edition_fiches_indicateurs:
    'Peut éditer uniquement les actions & indicateurs dont il est le pilote',
  lecture: 'Peut uniquement consulter',
};

export function getAccessLevelDescription(accessLevel: CollectiviteRole) {
  return accessLevelDescriptions[accessLevel];
}
