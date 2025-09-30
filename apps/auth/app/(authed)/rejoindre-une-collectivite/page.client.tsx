'use client';

import { useEffect } from 'react';
import { RejoindreUneCollectiviteModal } from './RejoindreUneCollectiviteModal';
import { useRejoindreUneCollectivite } from './useRejoindreUneCollectivite';

/**
 * Affiche la page "rejoindre une collectivité"
 *
 * Après le rattachement à la collectivité (ou l'annulation), l'utilisateur est redirigé sur la page associée à l'url contenu dans le param. `redirect_to`
 */
export const RejoindreUneCollectivitePage = ({
  redirectTo = '/',
}: {
  redirectTo: string;
}) => {
  const state = useRejoindreUneCollectivite({ redirectTo });

  // initialement charge les 10 premières collectivités
  useEffect(() => {
    state.onFilterCollectivites('');
  }, []); // eslint-disable-line

  return <RejoindreUneCollectiviteModal {...state} />;
};
