import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { ReferentielModeBanner } from '@/app/referentiels/referentiel-mode/referentiel-mode.banner';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
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
      <ReferentielModeBanner />
      {children}
    </ReferentielProvider>
  );
}
