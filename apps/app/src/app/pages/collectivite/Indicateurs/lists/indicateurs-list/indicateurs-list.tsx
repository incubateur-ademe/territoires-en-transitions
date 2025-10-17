import React, { useState } from 'react';

import { Pagination } from '@/ui';

import IndicateurCard from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/IndicateurCard';

import { useCurrentCollectivite } from '@/api/collectivites';
import { getIndicateurGroup } from '@/app/app/pages/collectivite/Indicateurs/lists/IndicateurCard/utils';
import { IndicateursListNoResults } from '@/app/app/pages/collectivite/Indicateurs/lists/indicateurs-list/indicateurs-list-empty';
import { makeCollectiviteIndicateursUrl } from '@/app/app/paths';
import {
  ListDefinitionsInputFilters,
  useListIndicateurDefinitions,
} from '@/app/indicateurs/definitions/use-list-indicateur-definitions';
import { CustomFilterBadges } from '@/app/ui/lists/filter-badges';
import { OpenState } from '@/ui/utils/types';
import { IndicateurCardSkeleton } from '../IndicateurCard/indicateur-card.skeleton';
import BadgeList from './badge-list';
import { IndicateursListeOptions } from './indicateurs-list-options';
import { SearchParams, sortByItems } from './use-indicateurs-list-params';

type Props = {
  searchParams: SearchParams;
  setSearchParams: (prams: SearchParams) => void;
  resetFilters?: () => void;
  defaultFilters?: ListDefinitionsInputFilters;
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

  const { displayGraphs, sortBy, currentPage, ...filters } = searchParams;

  // indique si le panneau des filtres est ouvert
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { data: { data: definitions, count = 0 } = {}, isPending } =
    useListIndicateurDefinitions(
      {
        filters,
        queryOptions: {
          page: currentPage,
          limit: maxNbOfCards,
          sort: sortByItems
            .filter((item) => item.value === sortBy)
            .map((item) => ({
              field: item.value,
              direction: item.direction,
            })),
        },
      },
      { disableAutoRefresh: false }
    );

  /** Filtres (définis par la vue courante) à exclure des badges */
  let filtresBadges = filters;
  if (defaultFilters) {
    const defaultFilterKeys = Object.keys(defaultFilters);
    filtresBadges = Object.fromEntries(
      Object.entries(filters).filter(
        ([key]) => !defaultFilterKeys.includes(key)
      )
    );
  }
  const isFiltered = Object.keys(filtresBadges).length > 0;

  return (
    <div className="grow flex flex-col gap-8">
      <IndicateursListeOptions
        {...props}
        searchParams={searchParams}
        setSearchParams={(options) =>
          setSearchParams({ ...searchParams, ...options })
        }
        isLoading={isPending}
        countTotal={count}
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
        isLoading={isPending}
        isEmpty={definitions?.length === 0}
      />
      {/** Chargement */}
      {isPending ? (
        <GridContainer>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <IndicateurCardSkeleton key={item} />
          ))}
        </GridContainer>
      ) : /** État vide  */
      definitions?.length === 0 ? (
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
          <GridContainer>
            {definitions?.map((definition) => (
              <IndicateurCard
                key={definition.id}
                definition={definition}
                href={makeCollectiviteIndicateursUrl({
                  collectiviteId,
                  indicateurView: getIndicateurGroup(
                    definition.identifiantReferentiel
                  ),
                  indicateurId: definition.id,
                  identifiantReferentiel: definition.identifiantReferentiel,
                })}
                className="hover:!bg-white"
                hideChart={!displayGraphs}
                isEditable={isEditable}
                readonly={isReadOnly}
              />
            ))}
          </GridContainer>
          <Pagination
            className="mx-auto mt-16"
            selectedPage={currentPage}
            nbOfElements={count}
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

const GridContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
    {children}
  </div>
);
