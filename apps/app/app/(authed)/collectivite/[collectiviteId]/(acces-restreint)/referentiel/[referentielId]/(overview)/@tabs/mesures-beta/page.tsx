'use client';

import { ReferentielTable } from '@/app/referentiels/referentiel.table/referentiel-table';
import { snapshotToReferentielTableRows } from '@/app/referentiels/referentiel.table/utils';
import { useSnapshot } from '@/app/referentiels/use-snapshot';
import { useParams } from 'next/navigation';

export default function Page() {
  const { referentielId } = useParams<{ referentielId: string }>();

  const { data: snapshot, isPending } = useSnapshot({
    actionId: referentielId,
  });

  const referentielData = snapshot
    ? snapshotToReferentielTableRows(snapshot)
    : [];

  return <ReferentielTable data={referentielData} isLoading={isPending} />;
}
