'use client';
import { getRejoindreCollectivitePath } from '@tet/api';
import { EmptyCard } from '@tet/ui';
import { useRouter } from 'next/navigation';
import PictoCarte from './carte.svg';

export default function Page() {
  const router = useRouter();

  return (
    <EmptyCard
      picto={(props) => <PictoCarte {...props} />}
      title="Merci pour votre inscription !"
      description="Dernière étape pour accéder à l'ensemble des fonctionnalités de Territoires en Transitions : rejoindre une collectivité."
      actions={[
        {
          children: 'Rejoindre une collectivité',
          onClick: () =>
            router.push(getRejoindreCollectivitePath(document.location.origin)),
          size: 'md',
        },
      ]}
      size="xl"
    />
  );
}
