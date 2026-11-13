'use client';

import { appLabels } from '@/app/labels/catalog';
import PictoDashboard from '@/app/ui/pictogrammes/PictoDashboard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorCard } from '@/app/utils/error/error.card';
import { useUser } from '@tet/api/users';
import { peutDeposerAvisInstructeur } from '@tet/domain/demarches';
import { useTrackDemarcheView } from '@/app/demarches/use-demarche-tracker';
import {
  Alert,
  Badge,
  cn,
  EmptyCard,
  Event,
  PageHeader,
  Pagination,
  useEventTracker,
} from '@tet/ui';
import { useDebouncedCallback } from 'use-debounce';
import { useListCollectivitesSuivies } from './data/use-list-collectivites-suivies';
import { useListDossiersInstruction } from './data/use-list-dossiers-instruction';
import { DossiersInstructionTable } from './dossiers-instruction.table';
import { SearchDossiersCombobox } from './search-dossiers.combobox';

const TRACK_RECHERCHE_DELAY_MS = 2000;

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
    isPlaceholderData,
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
    recherche,
    setRecherche,
    reinitialiserFiltres,
    setPage,
    trierPar,
  } = useListDossiersInstruction(serviceId);
  // Chargées en même temps que la liste, et non une fois le champ affiché.
  const { data: collectivitesSuivies } = useListCollectivitesSuivies(serviceId);

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

  const tracker = useEventTracker();
  useTrackDemarcheView(Event.demarches.pcaet.instructionListeVue, {
    acteur: 'instructeur',
    key: String(serviceId),
    enabled: !!data,
    properties: {
      instructeurType: typeDuService,
      deposeAvis,
      nbDossiers: data?.totalPerimetre,
      nbEnInstruction: data?.countByStatut.en_instruction,
    },
  });
  // Une recherche s'applique à chaque pause dans la frappe : on n'en compte
  // qu'une par recherche posée, et non une par pause.
  const trackRecherche = useDebouncedCallback(
    () =>
      tracker(Event.demarches.pcaet.instructionFiltre, {
        acteur: 'instructeur',
        instructeurType: typeDuService,
        filtres: ['recherche'],
      }),
    TRACK_RECHERCHE_DELAY_MS
  );
  const setFiltresTracked: typeof setFiltres = (nouveauxFiltres) => {
    tracker(Event.demarches.pcaet.instructionFiltre, {
      acteur: 'instructeur',
      instructeurType: typeDuService,
      filtres: Object.keys(nouveauxFiltres).sort(),
    });
    return setFiltres(nouveauxFiltres);
  };

  const afficherRegion = (data?.perimetreRegions.length ?? 0) > 1;
  const afficherDepartement = (data?.perimetreDepartements.length ?? 0) > 1;

  return (
    <div
      data-test="demarches.pcaet.instruction.demandes-avis"
      className="flex flex-col gap-6 pb-12"
    >
      <PageHeader>
        <PageHeader.Title className="flex flex-wrap items-center gap-3">
          {appLabels.instructionListeTitre}
          {/*
            La charge ne s'adresse qu'aux services qui rendent un avis. Les
            autres — DDT, DR ADEME, national — suivent des dossiers menés
            ailleurs : leur afficher une charge leur réclamerait un travail qui
            n'est pas le leur.
          */}
          {deposeAvis && data && (
            <Badge
              title={appLabels.instructionListeSoumisPourAvis({
                count: data.countByStatut.en_instruction,
              })}
              variant="info"
              size="sm"
              trim={false}
            />
          )}
        </PageHeader.Title>
      </PageHeader>

      {/*
        Avec la colonne Département, le tableau (87rem, 93rem avec la Région)
        ne tient pas dans les 90rem de la page. Dès 1600px, le cadre en sort,
        centré, à la largeur du tableau + `p-6` + bordure : le tableau ne
        défile plus et son en-tête reste collant.
      */}
      <section
        className={cn(
          'flex flex-col gap-4 rounded-xl border border-grey-3 bg-white p-6',
          afficherDepartement && 'min-[1600px]:self-center',
          afficherDepartement &&
            (afficherRegion
              ? 'min-[1600px]:w-[calc(96rem+2px)]'
              : 'min-[1600px]:w-[calc(90rem+2px)]')
        )}
      >
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
          // Se lit sur le périmètre et non sur `total` : un filtre qui ne rend
          // rien ne doit pas escamoter l'en-tête qui le porte.
          <EmptyCard
            picto={(props) => <PictoDashboard {...props} />}
            title={appLabels.instructionListeVide({ deposeAvis })}
          />
        ) : (
          <>
            <SearchDossiersCombobox
              collectivitesSuivies={collectivitesSuivies}
              recherche={recherche}
              filtres={filtres}
              onFiltresChange={setFiltresTracked}
              onSearch={(valeur) => {
                if (valeur.trim()) {
                  trackRecherche();
                } else {
                  trackRecherche.cancel();
                }
                setRecherche(valeur);
              }}
            />
            {/*
              Pendant le rechargement, `data` répond encore à la recherche
              précédente : le bandeau citerait la nouvelle à tort.
            */}
            {!isPlaceholderData && data.isRechercheApprochee && (
              <Alert
                state="warning"
                title={appLabels.instructionListeRechercheApprochee({
                  recherche,
                })}
              />
            )}
            <DossiersInstructionTable
              dossiers={data.items}
              deposeAvis={deposeAvis}
              afficherRegion={afficherRegion}
              regionsOptions={data.perimetreRegions}
              afficherDepartement={afficherDepartement}
              departementsOptions={data.perimetreDepartements}
              filtres={filtres}
              nbFiltresActifs={nbFiltresActifs}
              setFiltres={setFiltresTracked}
              sort={sort}
              direction={direction}
              trierPar={trierPar}
              etatVide={{
                picto: (props) => <PictoDashboard {...props} />,
                title: appLabels.instructionListeAucunResultat,
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
