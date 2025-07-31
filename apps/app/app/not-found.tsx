'use client';
import { EmptyCard } from '@/ui';
import PageContainer from '@/ui/components/layout/page-container';
import { PictoWarning } from '@/ui/design-system/Picto/PictoWarning';
import { redirect } from 'next/navigation';

export default function NotFound() {
  return (
    <PageContainer
      containerClassName="grow flex flex-col justify-center"
      bgColor="white"
    >
      <EmptyCard
        picto={(props) => <PictoWarning {...props} />}
        title="404"
        variant="transparent"
        subTitle={`Cette page n'existe pas`}
        actions={[
          {
            children: "Retourner à la page d'accueil",
            onClick: () => {
              redirect('/');
            },
            variant: 'outlined',
          },
        ]}
      />
    </PageContainer>
  );
}
