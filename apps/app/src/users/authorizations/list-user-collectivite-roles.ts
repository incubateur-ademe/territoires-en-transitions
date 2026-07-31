import { CollectiviteRole } from '@tet/domain/users';
import { getCollectiviteRoleLabel } from './collectivite-role.utils';

export const listUserCollectiviteRoles: {
  value: CollectiviteRole;
  label: string;
}[] = [
  {
    value: CollectiviteRole.ADMIN,
    label: getCollectiviteRoleLabel(CollectiviteRole.ADMIN),
  },
  {
    value: CollectiviteRole.EDITION,
    label: getCollectiviteRoleLabel(CollectiviteRole.EDITION),
  },
  {
    value: CollectiviteRole.EDITION_FICHES_INDICATEURS,
    label: getCollectiviteRoleLabel(
      CollectiviteRole.EDITION_FICHES_INDICATEURS
    ),
  },
  {
    value: CollectiviteRole.LECTURE,
    label: getCollectiviteRoleLabel(CollectiviteRole.LECTURE),
  },
];
