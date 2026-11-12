'use client';

import {
  makeCollectiviteDemarchePcaetConsultationUrl,
  makeCollectiviteDemarchePcaetRootUrl,
} from '@/app/app/paths';
import { useListDemarchesCouvrantes } from '@/app/demarches/pcaet/data/use-list-demarches-couvrantes';
import { useListPublicDemarchesPcaet } from '@/app/demarches/pcaet/data/use-list-public-demarches-pcaet';
import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import {
  DEMARCHE_PCAET_PUBLIC_STATUSES,
  demarchePcaetStatusValues,
  DemarcheTypeEnum,
} from '@tet/domain/demarches';
import { useTrackDemarcheView } from '@/app/demarches/use-demarche-tracker';
import { EmptyCard, Event, PageHeader } from '@tet/ui';
import { useMemo } from 'react';
import { ConsulterDemarcheCouvranteButton } from './consulter-demarche-couvrante.button';
import { DemarchesPcaetTable } from './demarches-pcaet.table';
import { PorteParSupraAlert } from './porte-par-supra.alert';
import {
  useFilterDemarchesPcaet,
  type DemarcheListItem,
} from './use-filter-demarches-pcaet';

const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

// Le dépôt d'un Supra qui couvre la collectivité s'ouvre dans les écrans du
// dossier, en lecture seule ; ses démarches publiques, dans la consultation.
const getDetailUrl = (demarche: DemarcheListItem) =>
  (demarche.porteur
    ? makeCollectiviteDemarchePcaetRootUrl
    : makeCollectiviteDemarchePcaetConsultationUrl)({
    collectiviteId: demarche.collectiviteId,
    demarcheId: demarche.id,
  });

const renderActions = (demarche: DemarcheListItem) =>
  demarche.porteur ? (
    <ConsulterDemarcheCouvranteButton demarche={demarche} />
  ) : null;

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
  const {
    data: couvrantes,
    isLoading: couvrantesEnAttente,
    isError: couvrantesEnErreur,
    refetch: refetchCouvrantes,
  } = useListDemarchesCouvrantes();
  const lignes = useMemo<DemarcheListItem[] | undefined>(
    () => demarches && [...(couvrantes ?? []), ...demarches],
    [demarches, couvrantes]
  );
  const { items, reinitialiserFiltres, ...pilotage } =
    useFilterDemarchesPcaet(lignes);
  useTrackDemarcheView(Event.demarches.pcaet.publicListeVue, {
    acteur: 'public',
    key: 'liste',
    enabled: demarches !== undefined,
    properties: { nbDemarches: demarches?.length },
  });

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
      <PorteParSupraAlert couvrantes={couvrantes} />
      <section className="rounded-xl border border-grey-3 bg-white p-6">
        {isLoading || couvrantesEnAttente ? (
          <div className="flex py-8">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : isError || couvrantesEnErreur || !lignes ? (
          <ErrorCard
            title={appLabels.uneErreurEstSurvenue}
            retry={() => {
              if (isError) refetch();
              if (couvrantesEnErreur) refetchCouvrantes();
            }}
          />
        ) : lignes.length === 0 ? (
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title={appLabels.demarcheListePubliqueAucune(PCAET_TYPE)}
          />
        ) : (
          <DemarchesPcaetTable
            ariaLabel={appLabels.demarcheListeTitre(PCAET_TYPE)}
            demarches={items}
            {...pilotage}
            statutOptions={
              couvrantes?.length
                ? demarchePcaetStatusValues
                : DEMARCHE_PCAET_PUBLIC_STATUSES
            }
            getDetailUrl={getDetailUrl}
            renderActions={couvrantes?.length ? renderActions : undefined}
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
