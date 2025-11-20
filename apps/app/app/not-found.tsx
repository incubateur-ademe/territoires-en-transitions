'use client';
import { EmptyCard, PictoWarning } from '@tet/ui';
import { redirect } from 'next/navigation';

export default function NotFound() {
  return (
    <EmptyCard
      className="m-auto"
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
  );
}
