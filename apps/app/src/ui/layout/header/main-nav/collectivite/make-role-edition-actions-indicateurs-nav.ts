import { makeTdbCollectiviteUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import { isUserVisitor, UserWithRolesAndPermissions } from '@tet/domain/users';
import { HeaderProps } from '@tet/ui';
import { generateCollectiviteNavItem } from './generate-collectivite-nav-item';
import { cleanButtonProps, CollectiviteNavItem } from './make-collectivite-nav';

export const makeSimplifiedViewNav = ({
  user,
  currentCollectivite,
}: {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent;
}): HeaderProps['mainNav'] => {
  const { collectiviteId } = currentCollectivite;

  const endItems: CollectiviteNavItem[] = [
    generateCollectiviteNavItem({ user, currentCollectivite }),
  ];

  return {
    startItems: [
      {
        isVisible: !isUserVisitor(user, {
          collectiviteId,
        }),
        children: appLabels.suiviPersonnel,
        href: makeTdbCollectiviteUrl({
          collectiviteId,
          view: 'personnel',
        }),
      },
    ].map(cleanButtonProps),
    endItems: endItems,
  };
};
