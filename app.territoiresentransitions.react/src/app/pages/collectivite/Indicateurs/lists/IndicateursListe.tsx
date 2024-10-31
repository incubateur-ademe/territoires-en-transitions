import { useEffect, useState } from 'react';

import {
  Button,
  Checkbox,
  Input,
  Pagination,
  Select,
  useEventTracker,
} from '@tet/ui';

import IndicateurCard from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import PictoExpert from 'ui/pictogrammes/PictoExpert';
import SpinnerLoader from 'ui/shared/SpinnerLoader';

import { Indicateurs } from '@tet/api';
import { getIndicateurGroup } from 'app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { useFilteredIndicateurDefinitions } from 'app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import ModuleFiltreBadges from 'app/pages/collectivite/TableauDeBord/components/ModuleFiltreBadges';
import { makeCollectiviteIndicateursUrl } from 'app/paths';
import { OpenState } from '@tet/ui/utils/types';
import { useCurrentCollectivite } from 'core-logic/hooks/useCurrentCollectivite';

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
  settings: (openState: OpenState) => React.ReactNode;
  filtres?: Indicateurs.FetchFiltre;
  resetFilters?: () => void;
  maxNbOfCards?: number;
  sortSettings?: SortIndicateurSettings;
  /** Rend les cartes indicateurs éditables */
  isEditable?: boolean;
};

/** Liste de fiches action avec tri et options de fitlre */
const IndicateursListe = ({
  sortSettings = {
    defaultSort: 'text',
  },
  filtres,
  resetFilters,
  settings,
  isEditable,
  maxNbOfCards = 9,
}: Props) => {
  const tracker = useEventTracker('app/indicateurs/tous');

  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectivite_id;

  const isReadonly = collectivite?.readonly ?? false;

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

  const { data, isLoading } = useFilteredIndicateurDefinitions(
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
  const countTotal = data?.length || 0;

  /** Liste filtrée des indicateurs à afficher */
  const currentDefs = data?.filter(
    (_, i) => Math.floor(i / maxNbOfCards) + 1 === currentPage
  );

  /** Affiche ou cache les graphiques des cartes */
  const [displayGraphs, setDisplayGraphs] = useState(true);

  return (
    <>
      <div className="flex items-center gap-8 py-6 border-y border-primary-3">
        {/** Tri */}
        <div className="w-64">
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
              collectivite_id: collectiviteId!,
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
      {filtres && (
        <ModuleFiltreBadges filtre={filtres} resetFilters={resetFilters} />
      )}

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      currentDefs?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 m-auto">
          <PictoExpert className="w-32 h-32" />
          <p className="text-primary-8">
            Aucun indicateur ne correspond à votre recherche
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
                card={{ external: true }}
                hideChart={!displayGraphs}
                autoRefresh
                isEditable={isEditable}
                readonly={isReadonly}
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

export default IndicateursListe;
