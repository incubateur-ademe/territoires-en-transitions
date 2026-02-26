import { CollectiviteRole } from '@tet/domain/users';
import { getCollectiviteRoleLabel } from './collectivite-role.utils';
import { useIsAccessEditionFichesIndicateursEnabled } from './use-is-access-edition-fiches-indicateurs-enabled';

export const useListUserCollectiviteRoles = () => {
  const isAccessEditionFichesIndicateursEnabled =
    useIsAccessEditionFichesIndicateursEnabled();

  const accessLevels: {
    isVisible?: boolean;
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
      isVisible: isAccessEditionFichesIndicateursEnabled || false,
      value: CollectiviteRole.EDITION_FICHES_INDICATEURS,
      label: getCollectiviteRoleLabel(
        CollectiviteRole.EDITION_FICHES_INDICATEURS
      ),
    },
    {
      value: CollectiviteRole.LECTURE,
      label: getCollectiviteRoleLabel(CollectiviteRole.LECTURE),
    },
  ].filter((level) => level.isVisible ?? true);

  return accessLevels;
};
