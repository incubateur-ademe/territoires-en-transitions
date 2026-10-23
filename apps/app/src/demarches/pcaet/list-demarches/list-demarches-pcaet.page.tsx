'use client';

import {
  makeCollectiviteDemarchePcaetNouveauUrl,
  makeCollectiviteDemarchePcaetRootUrl,
} from '@/app/app/paths';
import { useListDemarchesPcaet } from '@/app/demarches/pcaet/data/use-list-demarches-pcaet';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  DemarcheTypeEnum,
  demarchePcaetStatusValues,
  isDemarchePcaetEnCours,
} from '@tet/domain/demarches';
import { Button } from '@tet/ui';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DemarchePcaetActionsButton } from './demarche-pcaet-actions.button';
import { DemarchesPcaetTable } from './demarches-pcaet.table';
import {
  useFilterDemarchesPcaet,
  type Demarche,
} from './use-filter-demarches-pcaet';

/** Ces écrans sont propres au PCAET : le type est connu. */
const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

const getDetailUrl = (demarche: Demarche) =>
  makeCollectiviteDemarchePcaetRootUrl({
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.id,
  });

const renderActions = (demarche: Demarche) => (
  <DemarchePcaetActionsButton demarche={demarche} />
);

export const ListDemarchesPcaetPage = () => {
  const router = useRouter();
  const { collectiviteId } = useCurrentCollectivite();
  const { data: demarches, isLoading, isError } = useListDemarchesPcaet();
  const { items, reinitialiserFiltres, ...pilotage } =
    useFilterDemarchesPcaet(demarches);
  const creationUrl = makeCollectiviteDemarchePcaetNouveauUrl({
    collectiviteId,
  });
  const isEmpty = demarches?.length === 0;

  // Sans démarche, la liste n'a rien à montrer : on va droit à la création.
  useEffect(() => {
    if (isEmpty) {
      router.replace(creationUrl);
    }
  }, [isEmpty, creationUrl, router]);

  if (isLoading || isEmpty) {
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

  // La création est bloquée tant qu'une démarche est « en cours » (même règle
  // que le backend : 409 + index unique partiel).
  const hasActiveDemarche = demarches.some((demarche) =>
    isDemarchePcaetEnCours(demarche.status)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-primary-9 m-0">
          {appLabels.demarcheListeTitre(PCAET_TYPE)}
        </h1>
        <Button
          size="sm"
          disabled={hasActiveDemarche}
          title={
            hasActiveDemarche
              ? appLabels.demarcheListeCreationBloquee(PCAET_TYPE)
              : undefined
          }
          onClick={() => router.push(creationUrl)}
        >
          {appLabels.demarcheListeCommencerDepot}
        </Button>
      </div>
      <section className="rounded-xl border border-grey-3 bg-white p-6">
        <DemarchesPcaetTable
          ariaLabel={appLabels.demarcheListeTitre(PCAET_TYPE)}
          demarches={items}
          {...pilotage}
          statutOptions={demarchePcaetStatusValues}
          getDetailUrl={getDetailUrl}
          renderActions={renderActions}
          etatVide={{
            picto: (props) => <PictoDashboard {...props} />,
            title: appLabels.demarcheListeAucunResultat,
            actions: [
              {
                children: appLabels.reinitialiserLesFiltres,
                onClick: reinitialiserFiltres,
                variant: 'outlined',
                size: 'sm',
              },
            ],
          }}
        />
      </section>
    </div>
  );
};
