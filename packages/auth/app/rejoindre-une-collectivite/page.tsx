'use client';

import {useSearchParams} from 'next/navigation';
import {RejoindreUneCollectiviteModal} from '@components/RejoindreUneCollectivite';
import {useRejoindreUneCollectivite} from 'app/rejoindre-une-collectivite/useRejoindreUneCollectivite';
import {useEffect} from 'react';

/**
 * Affiche la page "rejoindre une collectivité"
 *
 * Après le rattachement à la collectivité (ou l'annulation), l'utilisateur est redirigé sur la page associée à l'url contenu dans le param. `redirect_to`
 */
const RejoindreUneCollectivitePage = () => {
  // détermine l'url vers laquelle rediriger
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/';
  const state = useRejoindreUneCollectivite({redirectTo});

  // initialement charge les 10 premières collectivités
  useEffect(() => {
    state.onFilterCollectivites('');
  }, []); // eslint-disable-line

  return <RejoindreUneCollectiviteModal {...state} />;
};

export default RejoindreUneCollectivitePage;
