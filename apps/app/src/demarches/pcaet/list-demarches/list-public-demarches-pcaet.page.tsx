'use client';

import { makeCollectiviteDemarchePcaetConsultationUrl } from '@/app/app/paths';
import { useListPublicDemarchesPcaet } from '@/app/demarches/pcaet/data/use-list-public-demarches-pcaet';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  DEMARCHE_PCAET_PUBLIC_STATUSES,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { EmptyCard, PageHeader } from '@tet/ui';
import { DemarchesPcaetTable } from './demarches-pcaet.table';
import {
  useFilterDemarchesPcaet,
  type DemarcheListItem,
} from './use-filter-demarches-pcaet';

const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

const getDetailUrl = (demarche: DemarcheListItem) =>
  makeCollectiviteDemarchePcaetConsultationUrl({
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.id,
  });

/**
 * Les démarches de la collectivité pour qui n'en édite pas : seulement celles
 * des statuts publics, sans création ni actions.
 */
export const ListPublicDemarchesPcaetPage = () => {
  const {
    data: demarches,
    isLoading,
    isError,
    refetch,
  } = useListPublicDemarchesPcaet();
  const { items, reinitialiserFiltres, ...pilotage } =
    useFilterDemarchesPcaet(demarches);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader>
        <PageHeader.Title>
          {appLabels.demarcheListeTitre(PCAET_TYPE)}
        </PageHeader.Title>
        <PageHeader.Subtitle>
          {appLabels.demarcheListePubliqueDescription}
        </PageHeader.Subtitle>
      </PageHeader>
      <section className="rounded-xl border border-grey-3 bg-white p-6">
        {isLoading ? (
          <div className="flex py-8">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : isError || !demarches ? (
          <ErrorCard
            title={appLabels.uneErreurEstSurvenue}
            retry={() => refetch()}
          />
        ) : demarches.length === 0 ? (
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title={appLabels.demarcheListePubliqueAucune(PCAET_TYPE)}
          />
        ) : (
          <DemarchesPcaetTable
            demarches={items}
            {...pilotage}
            statutOptions={DEMARCHE_PCAET_PUBLIC_STATUSES}
            getDetailUrl={getDetailUrl}
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
        )}
      </section>
    </div>
  );
};
