import { useEffect, useState } from 'react';

import {
  Checkbox,
  EmptyCard,
  Input,
  Pagination,
  Select,
  useEventTracker,
} from '@/ui';

import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import PictoExpert from '@/app/ui/pictogrammes/PictoExpert';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

import { Indicateurs } from '@/api';
import { ExportIndicateursPageName } from '@/app/app/pages/collectivite/Indicateurs/Indicateur/useExportIndicateurs';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import BadgeList from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/badge-list';
import { useFilteredIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges';
import { OpenState } from '@/ui/utils/types';
import classNames from 'classnames';

type sortByOptionsType = {
  label: string;
  value: keyof Indicateurs.FetchFiltre;
  direction: 'asc' | 'desc';
};

type SortSettings<T> = {
  defaultSort: T;
  sortOptionsDisplayed?: T[];
};

type SortIndicateurSettings = SortSettings<keyof Indicateurs.FetchFiltre>;

const sortByOptions: sortByOptionsType[] = [
  {
    label: 'Complétude',
    value: 'estComplet',
    direction: 'desc',
  },
  {
    label: 'Ordre alphabétique',
    value: 'text',
    direction: 'asc',
  },
];

type Props = {
  settings?: (openState: OpenState) => React.ReactNode;
  filtres?: Indicateurs.FetchFiltre;
  customFilterBadges?: CustomFilterBadges;
  resetFilters?: () => void;
  maxNbOfCards?: number;
  sortSettings?: SortIndicateurSettings;
  /** Rend les cartes indicateurs éditables */
  isEditable?: boolean;
  // pour le tracking
  pageName?: ExportIndicateursPageName;
  menuContainerClassname?: string;
};

/** Liste d'indicateurs avec tri et options de fitlre */
const IndicateursListe = ({
  pageName,
  sortSettings = {
    defaultSort: 'text',
  },
  filtres = {},
  customFilterBadges,
  resetFilters,
  settings,
  isEditable,
  maxNbOfCards = 9,
  menuContainerClassname,
}: Props) => {
  const tracker = useEventTracker('app/indicateurs/tous');

  const collectivite = useCurrentCollectivite()!;
  const collectiviteId = collectivite.collectiviteId;

  const isReadonly = collectivite.isReadOnly ?? false;

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  /** Tri sélectionné */
  const [sort, setSort] = useState(
    sortByOptions.find((o) => o.value === sortSettings.defaultSort)!
  );

  /** Récupère les différentes options de tri à partir des paramètres ou par défault */
  const getSortOptions = () => {
    const optionsDisplayed = sortSettings.sortOptionsDisplayed;

    if (optionsDisplayed) {
      return sortByOptions
        .filter((o) => optionsDisplayed.includes(o.value))
        .map((o) => ({ label: o.label, value: o.value }));
    } else {
      return sortByOptions.map((o) => ({ label: o.label, value: o.value }));
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

  const { data: definitions, isLoading } = useFilteredIndicateurDefinitions(
    {
      filtre: {
        ...filtres,
        text: debouncedSearch,
      },
      sort:
        sort.value === 'estComplet'
          ? [
              {
                field: sort.value,
                direction: sort.direction,
              },
            ]
          : undefined,
    },
    false
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filtres]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  /** Nombre total d'indicateurs filtrés */
  const countTotal = definitions?.length || 0;

  /** Liste filtrée des indicateurs à afficher */
  const currentDefs = definitions?.filter(
    (_, i) => Math.floor(i / maxNbOfCards) + 1 === currentPage
  );

  /** Affiche ou cache les graphiques des cartes */
  const [displayGraphs, setDisplayGraphs] = useState(true);

  return (
    <div className="flex flex-col gap-8">
      <div
        className={classNames(
          'flex max-xl:flex-col justify-between xl:items-center gap-4 py-6 border-y border-primary-3',
          menuContainerClassname
        )}
      >
        <div className="flex max-md:flex-col gap-x-8 gap-y-4 md:items-center">
          {/** Tri */}
          <div className="w-full md:w-64">
            <Select
              options={sortOptions}
              onChange={(value) =>
                value && setSort(sortByOptions.find((o) => o.value === value)!)
              }
              values={sort.value}
              customItem={(v) => <span className="text-grey-8">{v.label}</span>}
              disabled={sortOptions.length === 1}
              small
            />
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-4 max-md:order-first">
            {/** Toggle affichage des graph */}
            <Checkbox
              variant="switch"
              label="Afficher les graphiques"
              containerClassname="shrink-0"
              labelClassname="font-normal !text-grey-7"
              checked={displayGraphs}
              onChange={() => {
                setDisplayGraphs(!displayGraphs);
                tracker('toggle_graphique', {
                  collectiviteId,
                  niveauAcces: collectivite.niveauAcces,
                  role: collectivite.role,
                  actif: !displayGraphs,
                });
              }}
            />

            {/** Nombre total de résultats */}
            <span className="shrink-0 text-grey-7">
              {isLoading ? '--' : countTotal}
              {` `}
              {`indicateur`}
              {countTotal > 1 ? 's' : ''}
            </span>
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
          {settings?.({ isOpen: isSettingsOpen, setIsOpen: setIsSettingsOpen })}
        </div>
      </div>
      {/** Liste des filtres appliqués et bouton d'export */}
      <BadgeList
        pageName={pageName}
        definitions={definitions}
        filters={filtres}
        customFilterBadges={customFilterBadges}
        resetFilters={resetFilters}
        isLoading={isLoading}
        isEmpty={currentDefs?.length === 0}
      />

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      currentDefs?.length === 0 ? (
        <EmptyCard
          picto={(props) => <PictoExpert {...props} />}
          title="Aucun indicateur ne correspond à votre recherche"
          actions={[
            {
              children: 'Modifier le filtre',
              onClick: () => setIsSettingsOpen(true),
            },
          ]}
          background="bg-transparent"
          border="border-transparent"
        />
      ) : (
        /** Liste des indicateurs */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {currentDefs?.map((definition) => (
              <IndicateurCard
                key={definition.id}
                definition={definition}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId: collectiviteId!,
                  indicateurView: getIndicateurGroup(definition.identifiant),
                  indicateurId: definition.id,
                  identifiantReferentiel: definition.identifiant,
                })}
                className="hover:!bg-white"
                hideChart={!displayGraphs}
                isEditable={isEditable}
                readonly={isReadonly}
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
    </div>
  );
};

export default IndicateursListe;
