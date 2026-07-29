'use client';

import { signInPath } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { Alert, Button } from '@tet/ui';
import { useEffect, useRef } from 'react';

type ConfirmerRattachementViewProps = {
  token: string;
};

/**
 * Écran de confirmation du fallback « mot de passe oublié » : atteint
 * via le lien à usage unique reçu par email. Au montage, confirme le
 * rattachement puis affiche le résultat — succès ou échec (token
 * expiré/déjà utilisé) mènent tous deux vers la page de connexion,
 * l'utilisateur retombant en cas 3 s'il recommence.
 */
export const LinkOidcIdentityConfirmInvitationView = ({
  token,
}: ConfirmerRattachementViewProps) => {
  const trpc = useTRPC();
  const hasTriggered = useRef(false);

  const { mutate, isSuccess, error } = useMutation(
    trpc.users.authentications.oidc.confirmIdentityLinkedToUser.mutationOptions({
      meta: { disableToast: true },
    })
  );

  useEffect(() => {
    if (hasTriggered.current) {
      return;
    }
    hasTriggered.current = true;
    mutate({ token });
    // Ne déclenche la confirmation qu'une seule fois au montage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reconnectButton = (
    <Button href={signInPath} size="sm">
      {appLabels.proconnectBienvenueRattachementRetourConnexion}
    </Button>
  );

  if (isSuccess) {
    return (
      <div data-test="oidc.confirm-invitation.succes">
        <Alert
          state="success"
          description={appLabels.proconnectConfirmerRattachementSucces}
          footer={reconnectButton}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div data-test="oidc.confirm-invitation.erreur">
        <Alert
          state="error"
          description={appLabels.proconnectConfirmerRattachementEchec}
          footer={reconnectButton}
        />
      </div>
    );
  }

  return (
    <div data-test="oidc.confirm-invitation.en-cours">
      <Alert
        state="info"
        description={appLabels.proconnectConfirmerRattachementEnCours}
      />
    </div>
  );
};
