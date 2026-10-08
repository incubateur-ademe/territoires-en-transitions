'use client';
import { EmptyCard, PictoWarning } from '@tet/ui';

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
          href: '/',
          variant: 'outlined',
        },
      ]}
    />
  );
}
