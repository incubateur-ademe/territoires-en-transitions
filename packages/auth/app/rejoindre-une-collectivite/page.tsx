'use client';

import { getAuthPaths, restoreSessionFromAuthTokens } from '@tet/api';
import { useRejoindreUneCollectivite } from '@tet/auth/app/rejoindre-une-collectivite/useRejoindreUneCollectivite';
import { RejoindreUneCollectiviteModal } from '@tet/auth/components/RejoindreUneCollectivite';
import { supabase } from '@tet/auth/src/clientAPI';
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

  // redirige sur la page de login si l'utilisateur n'est pas  connecté
  useEffect(() => {
    const restore = async () => {
      const ret = await restoreSessionFromAuthTokens(supabase);
      if (!ret?.data.session) {
        document.location.replace(getAuthPaths(redirect_to).login);
      }
    };
    restore();
  }, [redirect_to]);

  // initialement charge les 10 premières collectivités
  useEffect(() => {
    state.onFilterCollectivites('');
  }, []); // eslint-disable-line

  return <RejoindreUneCollectiviteModal {...state} />;
};

export default RejoindreUneCollectivitePage;
