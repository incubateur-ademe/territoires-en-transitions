'use client';

import { appLabels } from '@/app/labels/catalog';
import { MetricCard } from '@/app/tableaux-de-bord/metrics/metric.card';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { PcaetDemandeAvisEtatEnum } from '@tet/domain/demarches';
import { EmptyCard, Pagination } from '@tet/ui';
import { useListDemandesAvis } from './data/use-list-demandes-avis';
import { DemandesAvisTable } from './demandes-avis.table';

export const DemandesAvisPage = () => {
  const { collectiviteId } = useCurrentCollectivite();
  const user = useUser();
  const { data, isLoading, isError, refetch, page, limit, setPage, trierPar } =
    useListDemandesAvis();

  const aInstruire = data
    ? data.countByEtat[PcaetDemandeAvisEtatEnum.A_TRAITER] +
      data.countByEtat[PcaetDemandeAvisEtatEnum.BROUILLON_EN_COURS]
    : 0;
  const instruits =
    data?.countByEtat[PcaetDemandeAvisEtatEnum.AVIS_RENDU] ?? 0;
  const delaiMoyenJours = data?.stats.delaiMoyenJours ?? 0;
  const nbCollectivites = data?.stats.nbCollectivites ?? 0;

  return (
    <div
      data-test="demarches.pcaet.instruction.demandes-avis"
      className="flex flex-col gap-6 pb-12"
    >
      <h1 className="text-2xl font-bold text-primary-9 m-0">
        {appLabels.instructionBonjour({ prenom: user.prenom })}
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title={appLabels.instructionStatATraiter}
          count={aInstruire}
        />
        <MetricCard
          title={appLabels.instructionStatInstruits({ count: instruits })}
          count={instruits}
        />
        <MetricCard
          title={appLabels.instructionStatDelaiMoyen({
            count: delaiMoyenJours,
          })}
          count={delaiMoyenJours}
        />
        <MetricCard
          title={appLabels.instructionStatCollectivites({
            count: nbCollectivites,
          })}
          count={nbCollectivites}
        />
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-grey-3 bg-white p-6">
        <h2 className="text-lg font-bold text-primary-9 m-0">
          {appLabels.instructionListeTitre}
        </h2>

        {isLoading ? (
          <div className="flex py-12">
            <SpinnerLoader className="m-auto" />
          </div>
        ) : isError || !data ? (
          <ErrorCard
            title={appLabels.uneErreurEstSurvenue}
            retry={() => refetch()}
          />
        ) : data.items.length === 0 ? (
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title={appLabels.instructionListeVide}
          />
        ) : (
          <>
            <DemandesAvisTable
              demandes={data.items}
              collectiviteId={collectiviteId}
              onTrierParCollectivite={() => trierPar('collectivite')}
              onTrierParEcheance={() => trierPar('echeance')}
            />
            <Pagination
              selectedPage={page}
              nbOfElements={data.total}
              maxElementsPerPage={limit}
              onChange={setPage}
              className="mx-auto"
            />
          </>
        )}
      </section>
    </div>
  );
};
