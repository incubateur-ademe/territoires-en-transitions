import { ChecklistPageHeader } from '@/app/referentiels/audit-labellisation/checklist-page-header/checklist-page-header';
import { ChecklistProvider } from '@/app/referentiels/audit-labellisation/checklist.context';
import {
  isAuditLabellisationReferentiel,
  referentielIdEnumSchema,
} from '@tet/domain/referentiels';
import { Spacer } from '@tet/ui';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { TabsWrapper } from './tabs-wrapper';

export default async function Layout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ collectiviteId: string; referentielId: string }>;
}) {
  const { referentielId: unsafeReferentielId } = await params;
  const parsed = referentielIdEnumSchema.safeParse(unsafeReferentielId);
  if (!parsed.success) {
    notFound();
  }
  const referentielId = parsed.data;

  const overview = (
    <>
      <ChecklistPageHeader referentielId={referentielId} />
      <Spacer height={1} />
      <TabsWrapper>{children}</TabsWrapper>
    </>
  );

  if (!isAuditLabellisationReferentiel(referentielId)) {
    return overview;
  }

  return (
    <ChecklistProvider referentielId={referentielId}>
      {overview}
    </ChecklistProvider>
  );
}
