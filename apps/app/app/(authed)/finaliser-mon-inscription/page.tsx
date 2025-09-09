'use client';
import { getRejoindreCollectivitePath } from '@/api';
import { EmptyCard } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useRouter } from 'next/navigation';
import PictoCarte from './carte.svg';

export default function Page() {
  const router = useRouter();

  return (
    <PageContainer>
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
    </PageContainer>
  );
}
