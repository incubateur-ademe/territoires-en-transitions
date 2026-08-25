'use client';

import { Event, LoginMethod, useEventTracker } from '@tet/ui';
import { useEffect, useRef } from 'react';
import { OIDC_LOGIN_COOKIE } from './login-user-with-oidc.cookies';

const readCookie = (name: string) =>
  document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];

/**
 * Enregistre les connexions par fournisseur d'identité, pendant des
 * `auth:login:success` posés par `useLoginState` pour les connexions
 * classiques : c'est la comparaison des deux qui donne la part de ProConnect.
 *
 * Le clic sur le bouton du fournisseur ne suffit pas — il ne dit rien des
 * abandons pendant le parcours ProConnect. Seul le retour effectif dans l'app
 * vaut connexion, d'où la lecture du marqueur `OIDC_LOGIN_COOKIE`.
 *
 * Monté à la racine (`root-providers.tsx`) : la destination d'après connexion
 * est quelconque (`next`).
 */
export const TrackLoginUserWithOidc = () => {
  const trackEvent = useEventTracker();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) {
      return;
    }

    const provider = readCookie(OIDC_LOGIN_COOKIE);
    if (!provider) {
      return;
    }
    hasTracked.current = true;

    // Marqueur consommé : il ne doit pas survivre à un rechargement de la page.
    document.cookie = `${OIDC_LOGIN_COOKIE}=; path=/; max-age=0`;

    trackEvent(Event.auth.login.success, {
      methode: 'oidc' satisfies LoginMethod,
      provider,
    });
  }, [trackEvent]);

  return null;
};
