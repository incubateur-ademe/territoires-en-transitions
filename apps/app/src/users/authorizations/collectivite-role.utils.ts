import { CollectiviteRole } from '@tet/domain/users';

const collectiviteRoleLabels: Record<CollectiviteRole, string> = {
  admin: 'Admin',
  edition: 'Éditeur',
  edition_fiches_indicateurs: 'Contributeur',
  lecture: 'Lecteur',
};

export function getCollectiviteRoleLabel(role: CollectiviteRole) {
  return collectiviteRoleLabels[role];
}

const collectiviteRoleDescriptions: Record<CollectiviteRole, string> = {
  admin: 'Peut entièrement configurer et éditer',
  edition: 'Peut éditer et inviter de nouveaux membres',
  edition_fiches_indicateurs:
    'Peut éditer uniquement les actions & indicateurs dont il est le pilote',
  lecture: 'Peut uniquement consulter',
};

export function getCollectiviteRoleDescription(role: CollectiviteRole) {
  return collectiviteRoleDescriptions[role];
}
