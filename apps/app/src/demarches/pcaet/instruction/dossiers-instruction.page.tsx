'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useUser } from '@tet/api/users';
import { peutDeposerAvisInstructeur } from '@tet/domain/demarches';
import { EmptyCard, Pagination } from '@tet/ui';
import { useListDossiersInstruction } from './data/use-list-dossiers-instruction';
import { DossiersInstructionMetrics } from './dossiers-instruction.metrics';
import { DossiersInstructionTable } from './dossiers-instruction.table';

/**
 * @param serviceId Le service dont on liste les dossiers, pris dans l'URL et non
 * dans le store : celui-ci est en retard d'un rendu quand on arrive d'un dossier,
 * et la requête partirait avec la collectivité instruite — que le serveur refuse.
 */
export const DossiersInstructionPage = ({
  serviceId,
}: {
  serviceId: number;
}) => {
  const user = useUser();
  const {
    data,
    isLoading,
    isError,
    refetch,
    page,
    limit,
    sort,
    direction,
    filtres,
    nbFiltresActifs,
    setFiltres,
    reinitialiserFiltres,
    setPage,
    trierPar,
  } = useListDossiersInstruction(serviceId);

  // La famille du service est lue sur l'accès désigné par l'URL, pour la même
  // raison que la requête : le store est en retard d'un rendu quand on arrive
  // d'un dossier. Sans accès identifiable, on retient la formulation de lecture
  // — ne rien réclamer de l'agent vaut mieux que le dire à tort.
  const typeDuService = user.collectivites.find(
    (acces) => acces.collectiviteId === serviceId
  )?.collectiviteType;
  const deposeAvis = typeDuService
    ? peutDeposerAvisInstructeur(typeDuService)
    : false;

  return (
    <div
      data-test="demarches.pcaet.instruction.demandes-avis"
      className="flex flex-col gap-6 pb-12"
    >
      <h1 className="text-2xl font-bold text-primary-9 m-0">
        {appLabels.instructionBonjour({ prenom: user.prenom })}
      </h1>

      {/*
        Les compteurs de charge ne s'adressent qu'aux services qui instruisent.
        Les autres — DDT, DR ADEME, national — suivent des dossiers menés
        ailleurs : « à instruire » leur réclamerait un travail qui n'est pas le
        leur, et le délai moyen mesurerait la performance d'un autre service.
      */}
      {deposeAvis && data && (
        <DossiersInstructionMetrics
          countByStatut={data.countByStatut}
          delaiMoyenJours={data.stats.delaiMoyenJours}
        />
      )}

      <section className="flex flex-col gap-4 rounded-xl border border-grey-3 bg-white p-6">
        <h2 className="text-lg font-bold text-primary-9 m-0">
          {appLabels.instructionListeTitre({ deposeAvis })}
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
        ) : data.totalPerimetre === 0 ? (
          // Un périmètre sans le moindre dossier : il n'y a pas de filtre à
          // desserrer, et le tableau n'aurait que ses en-têtes à montrer.
          //
          // Se lit sur le périmètre et non sur `total` : le filtre par défaut
          // masque à lui seul les dépôts en chantier et les collectivités sans
          // dossier, et un écran sans en-tête priverait alors l'agent du seul
          // moyen d'aller les voir.
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title={appLabels.instructionListeVide({ deposeAvis })}
          />
        ) : (
          <>
            <DossiersInstructionTable
              dossiers={data.items}
              deposeAvis={deposeAvis}
              afficherRegion={data.perimetreRegions.length > 1}
              regionsOptions={data.perimetreRegions}
              filtres={filtres}
              nbFiltresActifs={nbFiltresActifs}
              setFiltres={setFiltres}
              sort={sort}
              direction={direction}
              trierPar={trierPar}
              etatVide={{
                picto: (props) => <PictoDashboard {...props} />,
                title: appLabels.instructionListeAucunResultat,
                actions: [
                  {
                    children: appLabels.instructionListeReinitialiser,
                    onClick: reinitialiserFiltres,
                    variant: 'outlined',
                    size: 'sm',
                  },
                ],
              }}
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
