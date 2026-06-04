import { profilPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { signOutUser } from '@tet/api/utils/supabase/sign-out-user.server';
import {
  hasRole,
  PlatformRole,
  UserWithRolesAndPermissions,
} from '@tet/domain/users';

export const makeSecondaryNav = (user: UserWithRolesAndPermissions) => {
  return [
    {
      children: appLabels.aide,
      href: 'https://aide.territoiresentransitions.fr/fr/',
      icon: 'question-line',
      external: true,
    },
    {
      dataTest: 'nav-user',
      className: 'max-w-80',
      children: user.prenom,
      icon: `${
        hasRole(user, PlatformRole.SUPPORT)
          ? 'customer-service-line'
          : 'account-circle-line'
      }`,
      links: [
        {
          dataTest: 'user-profile',
          href: profilPath,
          children: appLabels.profil,
        },
        {
          dataTest: 'user-logout',
          children: appLabels.deconnexion,
          href: '/',
          onClick: async () => await signOutUser(),
        },
      ],
    },
  ];
};
