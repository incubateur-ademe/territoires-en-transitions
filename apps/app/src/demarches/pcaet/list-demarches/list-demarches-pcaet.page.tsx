'use client';

import { makeCollectiviteDemarchePcaetNouveauUrl } from '@/app/app/paths';
import { useListDemarchesPcaet } from '@/app/demarches/pcaet/data/use-list-demarches-pcaet';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { isActiveDemarchePcaetStatus } from '@tet/domain/demarches';
import { Button, EmptyCard } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { DemarchesPcaetTable } from './demarches-pcaet.table';

export const ListDemarchesPcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const { data: demarches, isLoading, isError } = useListDemarchesPcaet();

  if (isLoading) {
    return (
      <div className="flex grow items-center justify-center">
        <SpinnerLoader />
      </div>
    );
  }

  if (isError || !demarches) {
    return (
      <div className="flex grow items-center justify-center text-grey-7">
        {appLabels.uneErreurEstSurvenue}
      </div>
    );
  }

  const creationUrl = makeCollectiviteDemarchePcaetNouveauUrl({
    collectiviteId,
  });
  // La création est bloquée tant qu'une démarche est « en cours » (même règle
  // que le backend : 409 + index unique partiel).
  const hasActiveDemarche = demarches.some((demarche) =>
    isActiveDemarchePcaetStatus(demarche.status)
  );

  if (demarches.length === 0) {
    return (
      <div className="flex grow items-center justify-center p-8">
        <EmptyCard
          picto={(props) => <PictoDashboard {...props} />}
          title={appLabels.demarchePcaetListeVideTitre}
          description={[appLabels.demarchePcaetListeVideDescription]}
          actions={[
            {
              children: appLabels.demarchePcaetListeCommencerDepot,
              onClick: () => router.push(creationUrl),
            },
          ]}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 grow py-8 px-4 mx-auto w-full max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-9 mb-0">
          {appLabels.demarchePcaetListeTitre}
        </h1>
        <Button
          size="sm"
          disabled={hasActiveDemarche}
          title={
            hasActiveDemarche
              ? appLabels.demarchePcaetListeCreationBloquee
              : undefined
          }
          onClick={() => router.push(creationUrl)}
        >
          {appLabels.demarchePcaetListeCommencerDepot}
        </Button>
      </div>
      <DemarchesPcaetTable demarches={demarches} />
    </div>
  );
};
