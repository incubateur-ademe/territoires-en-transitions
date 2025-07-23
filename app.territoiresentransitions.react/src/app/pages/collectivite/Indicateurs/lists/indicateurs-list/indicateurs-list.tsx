import { useState } from 'react';

import { Pagination } from '@/ui';

import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';
import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';

import { useCurrentCollectivite } from '@/api/collectivites';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { IndicateursListNoResults } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-empty';
import { useFilteredIndicateurDefinitions } from '@/app/app/pages/collectivite/Indicateurs/lists/useFilteredIndicateurDefinitions';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges';
import { ListIndicateursRequestFilters } from '@/domain/indicateurs';
import { OpenState } from '@/ui/utils/types';
import BadgeList from './badge-list';
import { IndicateursListeOptions } from './indicateurs-list-options';
import { SearchParams, sortByCompletude } from './use-indicateurs-list-params';

type Props = {
  searchParams: SearchParams;
  setSearchParams: (prams: SearchParams) => void;
  resetFilters?: () => void;
  defaultFilters?: ListIndicateursRequestFilters;
  customFilterBadges?: CustomFilterBadges;
  renderSettings?: (openState: OpenState) => React.ReactNode;
  renderEmpty?: (
    isFiltered: boolean,
    setIsSettingsOpen?: (isOpen: boolean) => void
  ) => React.ReactNode;
  maxNbOfCards?: number;
  /** Rend les cartes indicateurs éditables */
  isEditable?: boolean;
  menuContainerClassname?: string;
};

/** Liste d'indicateurs avec tri et options de fitlre */
const IndicateursListe = (props: Props) => {
  const {
    searchParams,
    setSearchParams,
    renderEmpty,
    resetFilters,
    defaultFilters,
    customFilterBadges,
    isEditable,
    maxNbOfCards = 9,
    renderSettings,
  } = props;

  const { collectiviteId, isReadOnly } = useCurrentCollectivite();

  const { displayGraphs, sortBy, currentPage, ...filtres } = searchParams;

  // indique si le panneau des filtres est ouvert
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { data: definitions, isLoading } = useFilteredIndicateurDefinitions(
    {
      filtre: filtres,
      queryOptions: {
        sort:
          sortBy === sortByCompletude.value
            ? [
                {
                  field: sortByCompletude.value,
                  direction: sortByCompletude.direction,
                },
              ]
            : undefined,
      },
    },
    false
  );

  /** Nombre total d'indicateurs filtrés */
  const countTotal = definitions?.length || 0;

  /** Liste filtrée des indicateurs à afficher */
  const currentDefs =
    definitions?.filter(
      (_, i) => Math.floor(i / maxNbOfCards) + 1 === currentPage
    ) || [];

  /** Filtres (définis par la vue courante) à exclure des badges */
  let filtresBadges = filtres;
  if (defaultFilters) {
    const defaultFilterKeys = Object.keys(defaultFilters);
    filtresBadges = Object.fromEntries(
      Object.entries(filtres).filter(
        ([key]) => !defaultFilterKeys.includes(key)
      )
    );
  }
  const isFiltered = Object.keys(filtresBadges).length > 0;

  return (
    <div className="flex flex-col gap-8">
      <IndicateursListeOptions
        {...props}
        searchParams={searchParams}
        setSearchParams={(options) =>
          setSearchParams({ ...searchParams, ...options })
        }
        countTotal={countTotal}
        settingsOpenState={{
          isOpen: isSettingsOpen,
          setIsOpen: setIsSettingsOpen,
        }}
      />

      {/** Liste des filtres appliqués et bouton d'export */}
      <BadgeList
        definitions={definitions}
        filters={filtresBadges}
        customFilterBadges={customFilterBadges}
        resetFilters={resetFilters}
        isLoading={isLoading}
        isEmpty={currentDefs.length === 0}
      />

      {/** Chargement */}
      {isLoading ? (
        <div className="m-auto">
          <SpinnerLoader className="w-8 h-8" />
        </div>
      ) : /** État vide  */
      currentDefs.length === 0 ? (
        renderEmpty ? (
          renderEmpty(
            isFiltered,
            renderSettings ? setIsSettingsOpen : undefined
          )
        ) : (
          <IndicateursListNoResults setIsSettingsOpen={setIsSettingsOpen} />
        )
      ) : (
        /** Liste des indicateurs */
        // besoin de cette div car `grid` semble rentrer en conflit avec le container `flex` sur Safari
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
            {currentDefs.map((definition) => (
              <IndicateurCard
                key={definition.id}
                definition={definition}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId,
                  indicateurView: getIndicateurGroup(definition.identifiant),
                  indicateurId: definition.id,
                  identifiantReferentiel: definition.identifiant,
                })}
                className="hover:!bg-white"
                hideChart={!displayGraphs}
                isEditable={isEditable}
                readonly={isReadOnly}
              />
            ))}
          </div>
          <Pagination
            className="mx-auto mt-16"
            selectedPage={currentPage}
            nbOfElements={countTotal}
            maxElementsPerPage={maxNbOfCards}
            idToScrollTo="app-header"
            onChange={(currentPage) =>
              setSearchParams({ ...searchParams, currentPage })
            }
          />
        </div>
      )}
    </div>
  );
};

export default IndicateursListe;
