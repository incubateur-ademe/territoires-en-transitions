import { ChecklistProvider } from '@/app/referentiels/audit-labellisation/checklist.context';
import { ChecklistPageHeader } from '@/app/referentiels/audit-labellisation/checklist-page-header/checklist-page-header';
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

  if (!isAuditLabellisationReferentiel(referentielId)) {
    notFound();
  }

  return (
    <ChecklistProvider referentielId={referentielId}>
      <ChecklistPageHeader referentielId={referentielId} />
      <Spacer height={1} />
      <TabsWrapper>{children}</TabsWrapper>
    </ChecklistProvider>
  );
}
