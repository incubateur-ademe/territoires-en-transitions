'use client';

import { usePathname } from 'next/navigation';

import { getAuthPaths } from '@tet/api';
import { ENV } from '@tet/api/environmentVariables';
import { Header as HeaderTet } from '@tet/ui';

export const Header = ({
  showDemarchePcaet,
}: {
  /** Entrée masquée tant que la page n'est pas lancée (`PCAET_LAUNCHED`). */
  showDemarchePcaet: boolean;
}) => {
  const authPaths = getAuthPaths(ENV.app_url ?? '');

  const pathname = usePathname();

  return (
    <HeaderTet
      pathname={pathname}
      mainNav={{
        startItems: [
          {
            children: 'Accueil',
            href: '/',
          },
          {
            children: 'Programme TETE',
            href: '/programme',
          },
          ...(showDemarchePcaet
            ? [{ children: 'Démarche PCAET', href: '/demarche-pcaet' }]
            : []),
          {
            children: 'Plateforme numérique',
            href: '/plateforme-numerique',
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
  );
};
