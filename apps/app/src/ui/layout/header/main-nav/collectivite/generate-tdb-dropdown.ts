import { makeUserTdbUrl } from '@/app/tableaux-de-bord/make-user-tdb-url';
import { UserWithRolesAndPermissions } from '@tet/domain/users';
import { CollectiviteNavItem } from './make-collectivite-nav';

export const generateTdbLink = ({
  user,
  collectiviteId,
  collectiviteAccesRestreint,
  isVisitor,
}: {
  user: UserWithRolesAndPermissions;
  collectiviteId: number;
  collectiviteAccesRestreint: boolean;
  isVisitor: boolean;
}): CollectiviteNavItem | null => {
  if (collectiviteAccesRestreint && isVisitor) {
    return null;
  }

  return {
    icon: 'home-4-line',
    href: makeUserTdbUrl({ user, collectiviteId }),
  };
};
