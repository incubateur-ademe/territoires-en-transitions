'use client';

import {
  makeCollectiviteDemarchePcaetNouveauUrl,
  makeCollectiviteDemarchePcaetRootUrl,
} from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export const DemarchePcaetEntryPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const trpc = useTRPC();

  const { data: demarches, isLoading, isError } = useQuery(
    trpc.demarches.pcaet.list.queryOptions({ collectiviteId })
  );

  useEffect(() => {
    // Ne pas rediriger vers la création tant que la liste n'est pas chargée.
    if (isLoading || !demarches) {
      return;
    }
    if (demarches.length === 0) {
      router.replace(
        makeCollectiviteDemarchePcaetNouveauUrl({ collectiviteId })
      );
      return;
    }
    router.replace(
      makeCollectiviteDemarchePcaetRootUrl({
        collectiviteId,
        demarchePcaetId: demarches[0].id,
      })
    );
  }, [collectiviteId, router, demarches, isLoading]);

  if (isError) {
    return (
      <div className="flex grow items-center justify-center text-grey-7">
        {appLabels.uneErreurEstSurvenue}
      </div>
    );
  }

  return (
    <div className="flex grow items-center justify-center">
      <SpinnerLoader />
    </div>
  );
};
