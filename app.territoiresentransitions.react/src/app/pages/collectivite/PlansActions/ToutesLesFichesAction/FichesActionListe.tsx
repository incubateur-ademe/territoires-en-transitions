import { useCurrentCollectivite } from '@/api/collectivites';
import FicheActionCard from '@/app/app/pages/collectivite/PlansActions/FicheAction/Carte/FicheActionCard';
import {
  GetFichesOptions,
  useListFicheResumes,
} from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-list-fiche-resumes';
import { useFicheActionCount } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/useFicheActionCount';
import { getFichePageUrlForCollectivite } from '@/app/plans/fiches/get-fiche/get-fiche-page-url.util';
import { useCreatePlan } from '@/app/plans/plans/show-detailed-plan/data/use-create-plan';
import FilterBadges, {
  CustomFilterBadges,
  useFiltersToBadges,
} from '@/app/ui/lists/filter-badges';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { ErrorPage } from '@/app/utils/error.page';
import {
  ListFichesRequestFilters as Filtres,
  ListFichesRequestQueryOptions,
  ListFichesSortValue,
} from '@/domain/plans/fiches';
import { Checkbox, EmptyCard, Input, Pagination, Select } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import classNames from 'classnames';
import { isEqual } from 'es-toolkit';
import { useEffect, useRef, useState } from 'react';
import ActionsGroupeesMenu from '../ActionsGroupees/ActionsGroupeesMenu';
import EmptyFichePicto from '../FicheAction/FichesLiees/EmptyFichePicto';
import { useCreateFicheAction } from '../FicheAction/data/useCreateFicheAction';

type SortByOptions = NonNullable<
  ListFichesRequestQueryOptions['sort']
>[number] & {
  label: string;
};

type SortSettings<T> = {
  defaultSort: T;
  sortOptionsDisplayed?: T[];
};

export type SortFicheActionSettings = SortSettings<ListFichesSortValue>;

const sortByOptions: SortByOptions[] = [
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
  settings?: (openState: OpenState) => React.ReactNode;
  filtres: Filtres;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  maxNbOfCards?: number;
  sortSettings?: SortFicheActionSettings;
  enableGroupedActions?: boolean;
  isReadOnly?: boolean;
  containerClassName?: string;
  displayEditionMenu?: boolean;
  onUnlink?: (ficheId: number) => void;
};

/** Liste de fiches action avec tri et options de filtre */
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
  isReadOnly,
  containerClassName,
  displayEditionMenu = false,
  onUnlink,
}: Props) => {
  const filtresLocal = useRef(filtres);

  const collectivite = useCurrentCollectivite();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGroupedActionsOn, setIsGroupedActionsOn] = useState(false);
  const [selectedFicheIds, setSelectedFicheIds] = useState<number[]>([]);

  const { mutate: createFicheAction } = useCreateFicheAction();
  const { mutate: createPlanAction } = useCreatePlan({
    collectiviteId: collectivite.collectiviteId,
  });

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
  const ficheResumesOptions: GetFichesOptions = {
    filters: {
      ...filtres,
    },
    queryOptions: {
      page: currentPage,
      limit: maxNbOfCards,
      sort: [
        {
          field: sort.field,
          direction: sort.direction,
        },
      ],
    },
  };

  if (debouncedSearch) {
    ficheResumesOptions.filters = {
      ...ficheResumesOptions.filters,
      texteNomOuDescription: debouncedSearch,
    };
  }

  const {
    data: ficheResumes,
    isLoading,
    error,
  } = useListFicheResumes(collectivite.collectiviteId, ficheResumesOptions);
  const { count: hasFiches } = useFicheActionCount();

  /** Gère la sélection individuelle d'une fiche pour les actions groupées */
  const handleSelectFiche = (ficheId: number) => {
    if (selectedFicheIds.includes(ficheId)) {
      setSelectedFicheIds(selectedFicheIds.filter((id) => id !== ficheId));
    } else {
      setSelectedFicheIds([...selectedFicheIds, ficheId]);
    }
  };

  /** Gère la sélection de toutes les fiches */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFicheIds(ficheResumes?.allIds || []);
    } else {
      setSelectedFicheIds([]);
    }
  };

  /** Réinitialise la sélection quand les filtres changent */
  const resetSelection = () => {
    setSelectedFicheIds([]);
  };

  useEffect(() => {
    if (!isEqual(filtres, filtresLocal.current)) {
      filtresLocal.current = filtres;
      setCurrentPage(1);
      resetSelection();
    }
  }, [filtres]);

  useEffect(() => {
    setCurrentPage(1);
    resetSelection();
  }, [debouncedSearch]);

  const selectAll = ficheResumes?.allIds?.every((id) =>
    selectedFicheIds.includes(id)
  );

  const countTotal = ficheResumes?.count || 0;

  const { data: filterBadges } = useFiltersToBadges({
    filters: filtres,
    customValues: customFilterBadges,
  });

  if (error) {
    return (
      <ErrorPage
        error={error}
        reset={() => {
          resetFilters?.();
        }}
      />
    );
  }

  return (
    <>
      {!hasFiches && (
        <div className="col-span-full flex flex-col items-center p-12 text-center bg-primary-0 border border-primary-4 rounded-xl">
          <EmptyCard
            picto={(props) => <EmptyFichePicto {...props} />}
            title="Vous n'avez pas encore créé de fiche action !"
            subTitle="Une fois vos fiches action créées, vous les retrouvez toutes dans cette vue où vous pourrez les filtrer sur de nombreux critères."
            isReadonly={isReadOnly}
            actions={[
              {
                children: "Créer un plan d'action",
                onClick: () =>
                  collectivite &&
                  createPlanAction({
                    collectiviteId: collectivite.collectiviteId,
                    nom: 'Sans titre',
                    referents: [],
                  }),
                variant: 'outlined',
              },
              {
                children: 'Créer une fiche action',
                onClick: () => createFicheAction(),
              },
            ]}
            variant="transparent"
          />
        </div>
      )}

      {!!hasFiches && (
        <div
          className={classNames(
            'flex flex-col gap-8 bg-grey-2',
            containerClassName
          )}
        >
          <div className="relative bg-inherit">
            <div className="relative z-[1] bg-inherit flex max-xl:flex-col justify-between xl:items-center gap-4 py-6 border-y border-primary-3">
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
                        if (isGroupedActionsOn) {
                          setSelectedFicheIds([]);
                        }
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
                {settings?.({
                  isOpen: isSettingsOpen,
                  setIsOpen: setIsSettingsOpen,
                })}
              </div>
            </div>

            {/* Apperçu du nombre de fiches sélectionnées */}
            {enableGroupedActions && !isReadOnly && (
              <div
                className={classNames(
                  'relative flex justify-between py-5 border-b border-primary-3 transition-all duration-500',
                  {
                    '-translate-y-full -mb-16': !isGroupedActionsOn,
                    'translate-y-0 mb-0': isGroupedActionsOn,
                  }
                )}
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    label="Sélectionner toutes les actions"
                    checked={selectAll}
                    onChange={(evt) =>
                      handleSelectAll(evt.currentTarget.checked)
                    }
                    disabled={isLoading || !ficheResumes?.data?.length}
                  />
                </div>
                <div className="text-grey-7 font-medium">
                  <span className="text-primary-9">{`${
                    (selectedFicheIds ?? []).length
                  } action${
                    (selectedFicheIds ?? []).length > 1 ? 's' : ''
                  } sélectionnée${
                    (selectedFicheIds ?? []).length > 1 ? 's' : ''
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
          ficheResumes?.data?.length === 0 ? (
            <EmptyCard
              picto={(props) => <PictoExpert {...props} />}
              title="Aucune fiche action ne correspond à votre recherche"
              actions={[
                {
                  children: 'Modifier le filtre',
                  onClick: () => setIsSettingsOpen(true),
                },
              ]}
              variant="transparent"
            />
          ) : (
            /** Liste des fiches actions */
            // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ficheResumes?.data?.map((fiche) => (
                  <FicheActionCard
                    currentCollectivite={collectivite}
                    key={fiche.id}
                    ficheAction={fiche}
                    isEditable={displayEditionMenu}
                    onUnlink={onUnlink ? () => onUnlink(fiche.id) : undefined}
                    onSelect={
                      isGroupedActionsOn
                        ? () => handleSelectFiche(fiche.id)
                        : undefined
                    }
                    isSelected={!!selectedFicheIds?.includes(fiche.id)}
                    editKeysToInvalidate={[
                      [
                        'fiches_resume_collectivite',
                        collectivite?.collectiviteId,
                        ficheResumesOptions,
                      ],
                    ]}
                    link={getFichePageUrlForCollectivite({
                      fiche,
                      collectiviteId: collectivite.collectiviteId,
                    })}
                  />
                ))}
              </div>
              <Pagination
                className="mx-auto mt-16"
                selectedPage={currentPage}
                nbOfElements={countTotal}
                maxElementsPerPage={maxNbOfCards}
                idToScrollTo="app-header"
                onChange={setCurrentPage}
              />
            </div>
          )}

          <ActionsGroupeesMenu {...{ isGroupedActionsOn, selectedFicheIds }} />
        </div>
      )}
    </>
  );
};

export default FichesActionListe;
