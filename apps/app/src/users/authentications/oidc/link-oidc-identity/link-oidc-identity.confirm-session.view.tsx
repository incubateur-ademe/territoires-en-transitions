'use client';

import { signInPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { Alert, Button } from '@tet/ui';
import { useEffect, useRef } from 'react';
import { appendLinkedAccountsParam } from './link-oidc-identity.urls';
import { sanitizeNextPath } from '../../sanitize-next-path';

type ConfirmerSessionViewProps = {
  ticket: string;
  next?: string;
};

/**
 * Écran de confirmation après reconnexion classique (cas « Oui ») :
 * l'utilisateur arrive ici authentifié via la session classique.
 * Au montage, lie l'identité ProConnect (portée par le ticket) au compte classique.
 * Si succès, redirige vers `next` en réutilisant le toast existant (`comptes-associes=1`, voir `toast-liaison-comptes.tsx`)
 * pour une UX cohérente avec les autres cas.
 */
export const LinkOidcIdentityConfirmSessionView = ({
  ticket,
  next,
}: ConfirmerSessionViewProps) => {
  const trpc = useTRPC();
  const hasTriggered = useRef(false);

  const { mutate, error } = useMutation(
    trpc.users.authentications.oidc.linkIdentityToUserSession.mutationOptions({
      meta: { disableToast: true },
      onSuccess: () => {
        // Navigation DURE (et non `router.replace`) : cette page est dans le
        // groupe `(public)` sans les providers collectivité. Un rechargement
        // complet laisse le serveur traiter toute la chaîne auth → collectivité
        // → tableau de bord (comme `/auth/verify` pour le cas « Non »), au lieu
        // d'une navigation douce public → authed qui court-circuite le contexte
        // collectivité et provoque un faux 404.
        //
        // Défense en profondeur : on ré-assainit `next` ici (chemin relatif
        // interne uniquement) avant de l'affecter à `window.location`, sans
        // dépendre de l'assainissement de l'appelant.
        const dest = sanitizeNextPath(next) ?? '/';
        window.location.assign(appendLinkedAccountsParam(dest));
      },
    })
  );

  useEffect(() => {
    if (hasTriggered.current) {
      return;
    }
    hasTriggered.current = true;
    mutate({ ticket });
    // Ne déclenche la liaison qu'une seule fois au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    const code = error.data?.code;
    const message =
      code === 'CONFLICT'
        ? appLabels.proconnectConfirmerSessionDejaLieeAilleurs
        : code === 'FORBIDDEN'
        ? appLabels.proconnectConfirmerSessionCompteSupprime
        : code === 'BAD_REQUEST'
        ? appLabels.proconnectConfirmerSessionTicketExpire
        : appLabels.proconnectConfirmerSessionErreurGenerique;

    return (
      <div data-test="oidc.confirm-session.erreur">
        <Alert
          state="error"
          description={message}
          footer={
            <Button href={signInPath} size="sm">
              {appLabels.proconnectBienvenueRattachementRetourConnexion}
            </Button>
          }
        />
      </div>
    );
  }

  // Aussi en cas de succès : la confirmation est portée par le toast de la page
  // d'arrivée, un bandeau vert ici ne ferait que clignoter le temps que la
  // navigation dure s'exécute.
  return (
    <div data-test="oidc.confirm-session.en-cours">
      <Alert
        state="info"
        description={appLabels.proconnectConfirmerSessionEnCours}
      />
    </div>
  );
};
