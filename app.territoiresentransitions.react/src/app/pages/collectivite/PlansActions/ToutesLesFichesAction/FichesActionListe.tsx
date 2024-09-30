import { useEffect, useState } from 'react';

import { Button, Input, Pagination, Select } from '@tet/ui';
import {
  FetchOptions,
  Filtre,
  SortFichesAction,
  SortFichesActionValue,
} from '@tet/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { OpenState } from '@tet/ui/utils/types';
import SpinnerLoader from 'ui/shared/SpinnerLoader';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/Module/ModuleFiltreBadges';

import { useFicheResumesFetch } from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import { useCollectiviteId } from 'core-logic/hooks/params';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';

type sortByOptionsType = SortFichesAction & {
  label: string;
};

type SortSettings<T> = {
  defaultSort: T;
  sortOptionsDisplayed?: T[];
};

export type SortFicheActionSettings = SortSettings<SortFichesActionValue>;

const sortByOptions: sortByOptionsType[] = [
  {
    label: 'Date de modification',
    field: 'modified_at',
    direction: 'desc',
  },
  {
    label: 'Date de création',
    field: 'created_at',
    direction: 'desc',
  },
  {
    label: 'Ordre alphabétique',
    field: 'titre',
    direction: 'asc',
  },
];

type Props = {
  filtres: Filtre;
  settings: (openState: OpenState) => React.ReactNode;
  resetFilters?: () => void;
  maxNbOfCards?: number;
  sortSettings?: SortFicheActionSettings;
};

/** Liste de fiches action avec tri et options de fitlre */
const FichesActionListe = ({
  sortSettings = {
    defaultSort: 'modified_at',
  },
  filtres,
  resetFilters,
  settings,
  maxNbOfCards = 15,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /** Tri sélectionné */
  const [sort, setSort] = useState(
    sortByOptions.find((o) => o.field === sortSettings.defaultSort)!
  );

  /** Récupère les différentes options de tri à partir des paramètres ou par défault */
  const getSortOptions = () => {
    const optionsDisplayed = sortSettings.sortOptionsDisplayed;

    if (optionsDisplayed) {
      return sortByOptions
        .filter((o) => optionsDisplayed.includes(o.field))
        .map((o) => ({ label: o.label, value: o.field }));
    } else {
      return sortByOptions.map((o) => ({ label: o.label, value: o.field }));
    }
  };

  /** Options de tri affichées */
  const sortOptions = getSortOptions();

  /** Page courante */
  const [currentPage, setCurrentPage] = useState(1);

  /** Texte de recherche pour l'input */
  const [search, setSearch] = useState<string>();

  /** Texte de recherche avec debounced pour l'appel */
  const [debouncedSearch, setDebouncedSearch] = useState<string>();

  /** Options données à la fonction de récupération des fiches action */
  const ficheResumesOptions: FetchOptions = {
    filtre: {
      ...filtres,
      texteNomOuDescription: debouncedSearch,
    },
    page: currentPage,
    limit: maxNbOfCards,
    sort: [
      {
        field: sort.field,
        direction: sort.direction,
      },
    ],
  };

  const { data, isLoading } = useFicheResumesFetch({
    options: ficheResumesOptions,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [isLoading]);

  const countTotal = data?.count || 0;

  return (
    <>
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-64">
          <Select
            options={sortOptions}
            onChange={(value) =>
              value && setSort(sortByOptions.find((o) => o.field === value)!)
            }
            values={sort.field}
            customItem={(v) => <span className="text-grey-8">{v.label}</span>}
            disabled={sortOptions.length === 1}
            small
          />
        </div>
        {/** Nombre total de résultats */}
        <span className="shrink-0 text-grey-7">
          {isLoading ? '--' : countTotal}
          {` `}
          {`action`}
          {countTotal > 1 ? 's' : ''}
        </span>
        {/** Champ de recherche */}
        <Input
          type="search"
          onChange={(e) => setSearch(e.target.value)}
          onSearch={(v) => setDebouncedSearch(v)}
          value={search}
          containerClassname="ml-auto w-full md:w-96"
          placeholder="Rechercher par nom ou description"
          displaySize="sm"
        />
        {/** Bouton d'édition des filtres (une modale avec bouton ou un ButtonMenu) */}
        {settings({ isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen })}
      </div>
      {/** Liste des filtres appliqués */}
      <ModuleFiltreBadges filtre={filtres} resetFilters={resetFilters} />

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      data?.data?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoExpert className="w-32 h-32" />
          <p className="text-primary-8">
            Aucune fiche action ne correspond à votre recherche
          </p>

          <Button
            size="sm"
            onClick={() => {
              setIsSettingsOpen(true);
            }}
          >
            Modifier le filtre
          </Button>
        </div>
      ) : (
        /** Liste des fiches actions */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid grid-cols-2 2xl:grid-cols-3 gap-4">
            {data?.data?.map((fiche) => (
              <FicheActionCard
                key={fiche.id}
                ficheAction={fiche}
                isEditable
                editKeysToInvalidate={[
                  [
                    'fiches_resume_collectivite',
                    collectiviteId,
                    ficheResumesOptions,
                  ],
                ]}
                link={
                  fiche.plan_id
                    ? makeCollectivitePlanActionFicheUrl({
                        collectiviteId: collectiviteId!,
                        ficheUid: fiche.id.toString(),
                        planActionUid: fiche.plan_id.toString(),
                      })
                    : makeCollectiviteFicheNonClasseeUrl({
                        collectiviteId: collectiviteId!,
                        ficheUid: fiche.id.toString(),
                      })
                }
              />
            ))}
          </div>
          <div className="flex mt-16">
            <Pagination
              className="mx-auto"
              selectedPage={currentPage}
              nbOfElements={countTotal}
              maxElementsPerPage={maxNbOfCards}
              onChange={(page) => setCurrentPage(page)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default FichesActionListe;
