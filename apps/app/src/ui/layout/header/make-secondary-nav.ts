import { profilPath } from '@/app/app/paths';
import { signOutUser } from '@tet/api/utils/supabase/sign-out-user.server';
import { hasRole, PlatformRole, UserWithRolesAndPermissions } from '@tet/domain/users';

export const makeSecondaryNav = (user: UserWithRolesAndPermissions) => {
  return [
    {
      children: 'Aide',
      href: 'https://aide.territoiresentransitions.fr/fr/',
      icon: 'question-line',
      external: true,
    },
    {
      dataTest: 'nav-user',
      className: 'max-w-80',
      children: user.prenom,
      icon: `${
        hasRole(user, PlatformRole.SUPPORT) ? 'customer-service-line' : 'account-circle-line'
      }`,
      links: [
        {
          dataTest: 'user-profile',
          href: profilPath,
          children: 'Profil',
        },
        {
          dataTest: 'user-logout',
          children: 'Déconnexion',
          href: '/',
          onClick: async () => await signOutUser(),
        },
      ],
    },
  ];
};
