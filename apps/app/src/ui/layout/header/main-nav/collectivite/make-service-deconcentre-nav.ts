import { CollectiviteCurrent } from '@tet/api/collectivites';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';

export const makeServiceDeconcentreNav = ({
  user,
  currentCollectivite,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
}): HeaderProps['mainNav'] => {
  return {
    startItems: [],
    endItems: [generateCollectiviteNavItem({ user, currentCollectivite })],
  };
};
