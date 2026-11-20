'use client';
import { makeRejoindreCollectiviteUrl } from '@/app/app/paths';
import { makeConsumedInvitationsLanding } from '@/app/collectivites/membres/consume-pending-invitations/consume-pending-invitations.landing';
import { useConsumePendingInvitations } from '@/app/collectivites/membres/consume-pending-invitations/use-consume-pending-invitations';
import { appLabels } from '@/app/labels/catalog';
import { Alert, EmptyCard } from '@tet/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import PictoCarte from './carte.svg';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInvitationError = searchParams.get('error') === 'invitation';
  useConsumePendingInvitationsOnce();

  return (
    <>
      {hasInvitationError && (
        <Alert
          state="error"
          title="L'invitation n'a pas pu être traitée"
          description="Le lien d'invitation est invalide ou a expiré. Veuillez demander une nouvelle invitation à l'administrateur de votre collectivité, ou rejoignez une collectivité manuellement."
          className="mb-6"
        />
      )}
      <EmptyCard
        picto={(props) => <PictoCarte {...props} />}
        title="Merci pour votre inscription !"
        description="Dernière étape pour accéder à l'ensemble des fonctionnalités de Territoires en Transitions : rejoindre une collectivité."
        actions={[
          {
            children: appLabels.rejoindreUneCollectivite,
            onClick: () => router.push(makeRejoindreCollectiviteUrl()),
            size: 'md',
          },
        ]}
        size="xl"
      />
    </>
  );
}

/**
 * Filet des parcours de connexion qui n'ont pas repris les invitations en
 * attente (lien magique, onglet rouvert…) : ce cul-de-sac est celui d'un agent
 * de service déconcentré, qui ne peut pas « rejoindre » son service. Navigation
 * complète : le layout doit relire les collectivités du compte.
 */
function useConsumePendingInvitationsOnce() {
  const consumePendingInvitations = useConsumePendingInvitations();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    consumePendingInvitations().then((consumed) => {
      const landing = makeConsumedInvitationsLanding(consumed);
      if (landing) {
        window.location.replace(landing);
      }
    });
  }, [consumePendingInvitations]);
}
