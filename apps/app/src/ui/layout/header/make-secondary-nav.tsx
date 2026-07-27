import { getRechercheViewUrl, profilPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CollectiviteCurrent } from '@tet/api/collectivites';
import {
  hasRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';
import type { MouseEvent } from 'react';
import IconFrance from '../../icons/IconFrance';

type Args = {
  user: UserWithRolesAndPermissions;
  currentCollectivite: CollectiviteCurrent | null;
  onLogout: (event?: MouseEvent<HTMLAnchorElement>) => void | Promise<void>;
};

export const makeSecondaryNav = ({
  user,
  currentCollectivite,
  onLogout,
}: Args) => {
  return [
    {
      children: appLabels.collectivites,
      dataTest: 'nav-collectivites',
      className: 'font-medium',
      icon: <IconFrance className="h-4 w-4 fill-none" />,
      href: getRechercheViewUrl({
        collectiviteId: currentCollectivite?.collectiviteId ?? undefined,
        view: 'collectivites',
      }),
    },
    {
      className: 'font-medium [&>span]:text-base',
      children: appLabels.aide,
      href: 'https://aide.territoiresentransitions.fr/fr/',
      icon: 'question-line',
      external: true,
    },
    {
      dataTest: 'nav-user',
      className: 'max-w-80 font-medium [&>span]:text-base',
      children: user.prenom,
      icon: `${
        hasRole(user, PlatformRole.SUPPORT)
          ? 'customer-service-line'
          : 'user-line'
      }`,
      links: [
        {
          dataTest: 'user-profile',
          href: profilPath,
          children: appLabels.preferences,
        },
        {
          dataTest: 'user-logout',
          children: appLabels.deconnexion,
          href: '/',
          onClick: onLogout,
        },
      ],
    },
  ];
};
