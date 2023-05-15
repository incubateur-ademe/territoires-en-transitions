import {useMemo, useState} from 'react';
import {CollectivitesGrid} from 'app/pages/ToutesLesCollectivites/components/CollectivitesGrid';
import {
  NB_CARDS_PER_PAGE,
  useFilteredCollectivites,
} from './useFilteredCollectivites';
import {TDepartement, useDepartements} from './useDepartements';
import {TRegion, useRegions} from './useRegions';
import {TCollectivitesFilters} from './filtreLibelles';
import {FiltresColonne} from './components/FiltresColonne';
import {TCollectiviteCarte} from './types';
import {TrierParFiltre} from './components/Filtres';
import {Pagination} from './components/Pagination';
import {getNumberOfActiveFilters} from './getNumberOfActiveFilters';
import classNames from 'classnames';
import './ToutesLesCollectivites.css';
import AssocierCollectiviteBandeau from 'ui/collectivites/AssocierCollectiviteBandeau';
import {useOwnedCollectivites} from 'core-logic/hooks/useOwnedCollectivites';
import {DesactiverLesFiltres} from 'ui/shared/filters/DesactiverLesFiltres';
import {initialFilters, nameToShortNames} from './filters';
import {useSearchParams} from 'core-logic/hooks/query';

export type TRenderToutesCollectivitesProps = {
  regions: TRegion[];
  departements: TDepartement[];
  collectivites: TCollectiviteCarte[];
  collectivitesCount: number;
  filters: TCollectivitesFilters;
  setFilters: (filters: TCollectivitesFilters) => void;
  isLoading?: boolean;
};

export const RenderToutesLesCollectivites = (
  props: TRenderToutesCollectivitesProps
) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const ownedCollectivites = useOwnedCollectivites();
  const hasCollectivites = useMemo(
    () => ownedCollectivites?.length === 0,
    [ownedCollectivites]
  );

  return (
    <>
      {hasCollectivites && <AssocierCollectiviteBandeau />}
      <div
        data-test="ToutesLesCollectivites"
        className="app fr-container my-16"
      >
        <div className="text-center mb-8 md:mb-16">
          <div className="font-bold text-black md:text-4xl text-3xl mb-6">
            Collectivités
          </div>
          <p className="mb-0">
            Consultez les{' '}
            <a href="https://territoiresentransitions.fr/stats">statistiques</a>{' '}
            d'utilisation de la plateforme.
          </p>
        </div>
        <div className="md:flex">
          {/* Filters column */}
          <div
            className={classNames(
              'flex flex-col bg-white z-20 md:mr-6 md:!block md:w-3/12 xl:mr-14',
              {
                hidden: !isMobileFilterOpen,
                'collectivites-filter-column-mobile': isMobileFilterOpen,
              }
            )}
          >
            {isMobileFilterOpen && (
              <>
                {/* Close filters on mobile */}
                <div className="w-max ml-auto mb-8 border-b border-bf500">
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex items-center text-bf500 hover:!bg-none"
                  >
                    <span className="text-md">Fermer</span>
                    <span className="fr-fi-close-line ml-1 mt-1 scale-90"></span>
                  </button>
                </div>
                <h4>Filtrer</h4>
              </>
            )}
            <FiltresColonne
              filters={props.filters}
              setFilters={props.setFilters}
              regions={props.regions}
              departments={props.departements}
            />
            {isMobileFilterOpen && (
              /* Display results button on mobile */
              <button
                className="fr-btn mt-8 mx-auto"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Afficher les résultats
              </button>
            )}
          </div>
          {/* Trigger filters on mobile */}
          <MobileFilterButton
            numberOfActiveFilters={getNumberOfActiveFilters(props.filters)}
            handleOpenFilter={() => setIsMobileFilterOpen(true)}
          />
          {/* Collectivites column */}
          <div className="w-full">
            <div className="flex flex-col mb-6 md:flex-row md:justify-between">
              <div className="order-last mt-4 md:flex md:flex-col md:order-first md:mt-0">
                {props.collectivitesCount > 0 && (
                  <p className="mb-0 text-center text-gray-500 md:text-left">
                    {props.collectivitesCount === 1
                      ? 'Une collectivité correspond'
                      : `${props.collectivitesCount} collectivités correspondent`}{' '}
                    à votre recherche
                  </p>
                )}
                {getNumberOfActiveFilters(props.filters) > 0 && (
                  <DesactiverLesFiltres
                    onClick={() => props.setFilters(initialFilters)}
                  />
                )}
              </div>
              <TrierParFiltre
                onChange={selected =>
                  props.setFilters({
                    ...props.filters,
                    trierPar: selected ? [selected] : undefined,
                  })
                }
                selected={props.filters.trierPar?.[0]}
              />
            </div>
            <CollectivitesGrid
              isLoading={props.isLoading}
              isCardClickable={!hasCollectivites}
              collectivites={props.collectivites}
              collectivitesCount={props.collectivitesCount}
              filters={props.filters}
            />
            {props.collectivitesCount !== 0 && (
              <div className="flex justify-center mt-6 md:mt-12">
                <Pagination
                  nbOfPages={Math.ceil(
                    props.collectivitesCount / NB_CARDS_PER_PAGE
                  )}
                  selectedPage={props.filters.page ?? 1}
                  onChange={selected =>
                    props.setFilters({...props.filters, page: selected})
                  }
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const MobileFilterButton = (props: {
  numberOfActiveFilters: number;
  handleOpenFilter: () => void;
}) => {
  return (
    <div className="fixed bottom-0 inset-x-0 z-10 md:hidden">
      <button
        className={`fr-btn justify-center !py-6 text-center ${
          props.numberOfActiveFilters > 0
            ? 'fr-fi-filter-fill'
            : 'fr-fi-filter-line'
        } fr-fi--sm min-w-full text-center`}
        onClick={props.handleOpenFilter}
      >
        {props.numberOfActiveFilters > 0
          ? `Filtrer (${props.numberOfActiveFilters})`
          : 'Filtrer'}
      </button>
    </div>
  );
};

const ToutesLesCollectivites = () => {
  const {regions} = useRegions();
  const {departements} = useDepartements();

  // filtre initial
  const [filters, setFilters] = useSearchParams<TCollectivitesFilters>(
    'collectivites',
    initialFilters,
    nameToShortNames
  );
  const {collectivites, collectivitesCount, isLoading} =
    useFilteredCollectivites(filters);

  return (
    <RenderToutesLesCollectivites
      collectivites={collectivites}
      collectivitesCount={collectivitesCount}
      filters={filters}
      setFilters={setFilters}
      regions={regions}
      departements={departements}
      isLoading={isLoading}
    />
  );
};

export default ToutesLesCollectivites;
