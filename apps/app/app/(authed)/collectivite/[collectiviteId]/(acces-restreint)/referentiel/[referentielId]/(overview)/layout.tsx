import { RedirectToNewReferentielLayout } from '@/app/referentiels/redirect-to-new-referentiel-layout';
import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { ReactNode } from 'react';

export default async function Layout({
  tabs,
  children,
  params,
}: {
  tabs: ReactNode;
  children: ReactNode;
  params: Promise<{ collectiviteId: string; referentielId: string }>;
}) {
  const { referentielId: unsafeReferentielId } = await params;
  const referentielId = referentielIdEnumSchema.parse(unsafeReferentielId);

  return (
    <>
      <RedirectToNewReferentielLayout referentielId={referentielId} />

      {tabs}
      {children}
    </>
  );
}
