'use client';

import { useRejoindreUneCollectivite } from '@/auth/app/rejoindre-une-collectivite/useRejoindreUneCollectivite';
import { RejoindreUneCollectiviteModal } from '@/auth/components/RejoindreUneCollectivite';
import { useEffect } from 'react';

/**
 * Affiche la page "rejoindre une collectivité"
 *
 * Après le rattachement à la collectivité (ou l'annulation), l'utilisateur est redirigé sur la page associée à l'url contenu dans le param. `redirect_to`
 */
const RejoindreUneCollectivitePage = ({
  searchParams: { view = null, email = null, otp = null, redirect_to = '/' },
}: {
  searchParams: {
    view: string | null;
    email: string | null;
    otp: string | null;
    redirect_to: string;
  };
}) => {
  const state = useRejoindreUneCollectivite({ redirectTo: redirect_to });

  // initialement charge les 10 premières collectivités
  useEffect(() => {
    state.onFilterCollectivites('');
  }, []); // eslint-disable-line

  return <RejoindreUneCollectiviteModal {...state} />;
};

export default RejoindreUneCollectivitePage;
