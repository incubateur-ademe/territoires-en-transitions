'use client';
import { getRejoindreCollectivitePath } from '@tet/api';
import { Alert, EmptyCard } from '@tet/ui';
import { useRouter, useSearchParams } from 'next/navigation';
import PictoCarte from './carte.svg';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInvitationError = searchParams.get('error') === 'invitation';

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
            children: 'Rejoindre une collectivité',
            onClick: () =>
              router.push(
                getRejoindreCollectivitePath(document.location.origin)
              ),
            size: 'md',
          },
        ]}
        size="xl"
      />
    </>
  );
}
