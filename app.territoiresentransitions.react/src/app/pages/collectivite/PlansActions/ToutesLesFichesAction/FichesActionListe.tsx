import classNames from 'classnames';
import { useEffect, useState } from 'react';

import {
  FetchOptions,
  Filtre,
  SortFichesAction,
  SortFichesActionValue,
} from '@/api/plan-actions/fiche-resumes.list/domain/fetch-options.schema';
import { Alert, Button, Checkbox, Input, Pagination, Select } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import FicheActionCard from 'app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

import { useFicheResumesFetch } from 'app/pages/collectivite/PlansActions/FicheAction/data/useFicheResumesFetch';
import {
  makeCollectiviteFicheNonClasseeUrl,
  makeCollectivitePlanActionFicheUrl,
} from 'app/paths';
import { useCollectiviteId } from 'core-logic/hooks/params';
import FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from 'ui/shared/filters/filter-badges';
import ExportFicheActionGroupeesButton from '../ExportPdf/ExportFicheActionGroupeesButton';

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
  settings: (openState: OpenState) => React.ReactNode;
  filtres: Filtre;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  maxNbOfCards?: number;
  sortSettings?: SortFicheActionSettings;
  enableGroupedActions?: boolean;
};

/** Liste de fiches action avec tri et options de fitlre */
const FichesActionListe = ({
  sortSettings = {
    defaultSort: 'modified_at',
  },
  filtres,
  customFilterBadges,
  resetFilters,
  settings,
  maxNbOfCards = 15,
  enableGroupedActions = false,
}: Props) => {
  const collectiviteId = useCollectiviteId();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGroupedActionsOn, setIsGroupedActionsOn] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

  /** Gère les ids sélectionnés pour les actions groupées */
  const handleSelectId = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filtres]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const countTotal = data?.count || 0;

  const { data: filterBadges } = useFiltersToBadges({
    filters: filtres,
    customValues: customFilterBadges,
  });

  return (
    <>
      <div className="relative">
        <div className="relative z-[1] bg-grey-2 flex max-xl:flex-col justify-between xl:items-center gap-4 py-6 border-y border-primary-3">
          <div className="flex max-md:flex-col gap-x-8 gap-y-4 md:items-center">
            {/** Tri */}
            <div className="w-full md:w-64">
              <Select
                options={sortOptions}
                onChange={(value) =>
                  value &&
                  setSort(sortByOptions.find((o) => o.field === value)!)
                }
                values={sort.field}
                customItem={(v) => (
                  <span className="text-grey-8">{v.label}</span>
                )}
                disabled={sortOptions.length === 1}
                small
              />
            </div>

            <div className="flex gap-x-8 gap-y-4 max-md:order-first">
              {/** Nombre total de résultats */}
              <span className="shrink-0 text-grey-7">
                {isLoading ? '--' : countTotal}
                {` `}
                {`action`}
                {countTotal > 1 ? 's' : ''}
              </span>

              {/* Mode actions groupées */}
              {enableGroupedActions && (
                <Checkbox
                  label="Appliquer des actions groupées"
                  variant="switch"
                  labelClassname="font-normal !text-grey-7"
                  checked={isGroupedActionsOn}
                  onChange={(evt) => {
                    if (isGroupedActionsOn) setSelectedIds([]);
                    setIsGroupedActionsOn(evt.currentTarget.checked);
                  }}
                  disabled={isLoading}
                />
              )}
            </div>
          </div>

          <div className="flex gap-x-8 gap-y-4">
            {/** Champ de recherche */}
            <Input
              type="search"
              onChange={(e) => setSearch(e.target.value)}
              onSearch={(v) => setDebouncedSearch(v)}
              value={search}
              containerClassname="w-full xl:w-96"
              placeholder="Rechercher par nom ou description"
              displaySize="sm"
            />
            {/** Bouton d'édition des filtres (une modale avec bouton ou un ButtonMenu) */}
            {settings({ isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen })}
          </div>
        </div>

        {/* Apperçu du nombre de fiches sélectionnées */}
        {enableGroupedActions && (
          <div
            className={classNames(
              'relative flex justify-between py-5 border-b border-primary-3 transition-all duration-500',
              {
                '-translate-y-full -mb-16': !isGroupedActionsOn,
                'translate-y-0 mb-0': isGroupedActionsOn,
              }
            )}
          >
            <div className="text-grey-7 font-medium ml-auto">
              <span className="text-primary-9">{`${
                (selectedIds ?? []).length
              } action${
                (selectedIds ?? []).length > 1 ? 's' : ''
              } sélectionnée${
                (selectedIds ?? []).length > 1 ? 's' : ''
              }`}</span>
              {` / ${countTotal} action${countTotal > 1 ? 's' : ''}`}
            </div>
          </div>
        )}
      </div>

      {/** Liste des filtres appliqués */}
      {!!filterBadges?.length && (
        <FilterBadges badges={filterBadges} resetFilters={resetFilters} />
      )}

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((fiche) => (
              <FicheActionCard
                key={fiche.id}
                ficheAction={fiche}
                isEditable
                onSelect={
                  isGroupedActionsOn
                    ? () => handleSelectId(fiche.id)
                    : undefined
                }
                isSelected={selectedIds?.includes(fiche.id)}
                editKeysToInvalidate={[
                  [
                    'fiches_resume_collectivite',
                    collectiviteId,
                    ficheResumesOptions,
                  ],
                ]}
                link={
                  fiche.planId
                    ? makeCollectivitePlanActionFicheUrl({
                        collectiviteId: collectiviteId!,
                        ficheUid: fiche.id.toString(),
                        planActionUid: fiche.planId.toString(),
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

      <Alert
        className={classNames(
          'absolute left-0 bottom-0 border-t border-t-info-1 pt-2 pb-4 transition-all duration-500',
          {
            'opacity-100 z-50': isGroupedActionsOn && selectedIds.length > 1,
            'opacity-0 -z-10': selectedIds.length <= 1,
          }
        )}
        title="Appliquer une action groupée"
        description={
          <div className="flex gap-2">
            <ExportFicheActionGroupeesButton fichesIds={selectedIds} />
          </div>
        }
        fullPageWidth
        noIcon
      />
    </>
  );
};

export default FichesActionListe;
