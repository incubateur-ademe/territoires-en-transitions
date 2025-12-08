import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { referentielIdEnumSchema } from '@/domain/referentiels';
import { ReactNode } from 'react';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; referentielId: string }>;
}) {
  const { referentielId: unsafeReferentielId } = await params;
  const referentielId = referentielIdEnumSchema.parse(unsafeReferentielId);

  return (
    <ReferentielProvider referentielId={referentielId}>
      {children}
    </ReferentielProvider>
  );
}
