'use client';

import {
  makeCollectiviteDemarchePcaetDetailUrl,
  makeCollectiviteDemarchePcaetNouveauUrl,
} from '@/app/app/paths';
import { listDemarchesPcaet } from '@/app/demarches/pcaet/demarche-pcaet.storage';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const DemarchePcaetEntryPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();

  useEffect(() => {
    const demarches = listDemarchesPcaet(collectiviteId);
    if (demarches.length === 0) {
      router.replace(
        makeCollectiviteDemarchePcaetNouveauUrl({ collectiviteId })
      );
      return;
    }
    router.replace(
      makeCollectiviteDemarchePcaetDetailUrl({
        collectiviteId,
        demarchePcaetId: demarches[0].id,
      })
    );
  }, [collectiviteId, router]);

  return (
    <div className="flex grow items-center justify-center">
      <SpinnerLoader />
    </div>
  );
};
