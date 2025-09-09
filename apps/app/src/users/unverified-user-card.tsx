'use client';
import { EmptyCard } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { useRouter } from 'next/navigation';
import PictoCarte from '../../app/(authed)/finaliser-mon-inscription/carte.svg';

export function UnverifiedUserCard() {
  const router = useRouter();

  return (
    <PageContainer bgColor="primary">
      <EmptyCard
        picto={() => <PictoCarte height="200" width="200" />}
        title="Votre compte n'a pas encore été vérifié"
        subTitle="Pour accéder à cette page, votre compte doit être vérifié. N'hésitez pas à contacter le support via le chat ou par mail à l'adresse contact@territoiresentransitions.fr."
        actions={[
          {
            children: "Retourner à la page d'accueil",
            onClick: () => {
              router.push('/');
            },
            variant: 'outlined',
          },
        ]}
      />
    </PageContainer>
  );
}
