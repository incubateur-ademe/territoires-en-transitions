import { UserDetails } from '@/api/users/user-details.fetch.server';
import { signOutUser } from '@/api/utils/supabase/sign-out-user.server';
import { profilPath } from '@/app/app/paths';

export const makeSecondaryNav = (user: UserDetails) => {
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
      icon: `${user.isSupport ? 'customer-service' : 'account-circle-line'}`,
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
