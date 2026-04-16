import { appLabels } from '@/app/labels/catalog';
import { CollectiviteRole } from '@tet/domain/users';

const collectiviteRoleLabels: Record<CollectiviteRole, string> = {
  admin: appLabels.roleAdmin,
  edition: appLabels.roleEdition,
  edition_fiches_indicateurs: appLabels.roleContributeur,
  lecture: appLabels.roleLecteur,
};

export function getCollectiviteRoleLabel(role: CollectiviteRole): string {
  return collectiviteRoleLabels[role];
}

const collectiviteRoleDescriptions: Record<CollectiviteRole, string> = {
  admin: appLabels.roleAdminDescription,
  edition: appLabels.roleEditionDescription,
  edition_fiches_indicateurs: appLabels.roleContributeurDescription,
  lecture: appLabels.roleLecteurDescription,
};

export function getCollectiviteRoleDescription(role: CollectiviteRole): string {
  return collectiviteRoleDescriptions[role];
}
