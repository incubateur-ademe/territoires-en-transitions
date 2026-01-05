'use client';

import { usePathname } from 'next/navigation';

import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { DSFRCompliancyComponent, Header as HeaderTet } from '@tet/ui';

export const Header = () => {
  const authPaths = getAuthPaths(ENV.app_url ?? '');

  const pathname = usePathname();

  return (
    <>
      <HeaderTet
        pathname={pathname}
        mainNav={{
          startItems: [
            {
              children: 'Accueil',
              href: '/',
            },
            {
              children: 'Programme',
              href: '/programme',
            },
            {
              children: 'Outil numérique',
              href: '/outil-numerique',
            },
            {
              children: 'Rencontres',
              href: 'https://rencontres.territoiresentransitions.fr/',
            },
            {
              children: 'Collectivités',
              href: '/collectivites',
            },
            {
              children: 'Actualités',
              href: '/actus',
            },
            {
              children: 'Contact',
              href: '/contact',
            },
          ],
        }}
        secondaryNav={[
          {
            children: 'FAQ',
            href: '/faq',
            icon: 'question-line',
          },
          {
            children: 'Créer un compte',
            href: authPaths?.signUp,
            icon: 'add-circle-line',
            external: true,
          },
          {
            children: 'Se connecter',
            href: authPaths?.login,
            icon: 'account-circle-line',
            external: true,
          },
        ]}
      />
      <DSFRCompliancyComponent />
    </>
  );
};
