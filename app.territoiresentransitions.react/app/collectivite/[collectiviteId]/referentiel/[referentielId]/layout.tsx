import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { ReferentielId } from '@/domain/referentiels';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ referentielId: ReferentielId }>;
}) {
  const { referentielId } = await params;

  return (
    <ReferentielProvider referentielId={referentielId}>
      {children}
    </ReferentielProvider>
  );
}
