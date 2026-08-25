'use client';

import { appLabels } from '@/app/labels/catalog';
import { Event, useEventTracker } from '@tet/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useToastContext } from './toast-context';

const LIAISON_PARAM = 'comptes-associes';

/** Plus long que les 4 s par défaut : le toast arrive au sortir des redirections OIDC. */
const AUTO_HIDE_DURATION = 6000;

/**
 * Toast one-shot « comptes associés » : toute liaison OIDC (automatique ou
 * assistée) est signalée par un paramètre d'URL déposé par
 * `app/auth/verify/route.ts`, jamais par un état stocké en session — ce
 * composant le lit une fois au montage, affiche le toast, puis nettoie l'URL
 * pour qu'il ne réapparaisse pas au refresh.
 *
 * Monté au niveau racine (`root-providers.tsx`, dans `ToastProvider`) : le
 * paramètre peut arriver sur n'importe quelle page cible (`next`).
 *
 * Porte aussi l'événement `auth:oidc:linked` : ce paramètre est le seul point
 * de passage commun à TOUTES les liaisons abouties (automatique au callback,
 * assistée par reconnexion, volontaire depuis le profil). Le suivre ailleurs
 * multiplierait les comptages, ou en manquerait.
 */
export function ToastLiaisonComptes() {
  const { setToast } = useToastContext();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const trackEvent = useEventTracker();

  useEffect(() => {
    if (searchParams.get(LIAISON_PARAM) !== '1') {
      return;
    }

    trackEvent(Event.auth.oidc.linked, { origine: pathname });

    // `success` et non `info` : le statut `info` est rendu en orange.
    setToast('success', appLabels.comptesAssocies, AUTO_HIDE_DURATION);

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete(LIAISON_PARAM);
    const query = nextSearchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // Ne dépend que du paramètre lu au montage : on ne veut surtout pas
    // redéclencher le toast si `searchParams`/`router` changent d'identité.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
