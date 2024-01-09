import {TrierParFiltre} from '../anciensComponents/Filtres';
import {CollectivitesGrid} from '../anciensComponents/CollectivitesGrid';
import {Pagination} from '../anciensComponents/Pagination';
import {DesactiverLesFiltres} from 'ui/shared/filters/DesactiverLesFiltres';

import {NB_CARDS_PER_PAGE} from '../data/useFilteredCollectivites';
import {TSetFilters, getNumberOfActiveFilters} from '../data/filters';
import {TCollectivitesFilters} from '../data/filtreLibelles';
import {TCollectiviteCarte} from '../types';

type View = {
  initialFilters: TCollectivitesFilters;
  filters: TCollectivitesFilters;
  setFilters: TSetFilters;
  data: TCollectiviteCarte[];
  dataCount: number;
  isLoading: boolean;
  canUserClickCard: boolean;
};

const CollectivitesView = ({
  initialFilters,
  filters,
  setFilters,
  data,
  dataCount,
  isLoading,
  canUserClickCard,
}: View) => {
  return (
    <div className="grow">
      <div className="flex flex-col mb-6 md:flex-row md:justify-between">
        <div className="order-last mt-4 md:flex md:flex-col md:order-first md:mt-0">
          {dataCount > 0 && (
            <p className="mb-0 text-center text-gray-500 md:text-left">
              {dataCount === 1
                ? 'Une collectivité correspond'
                : `${dataCount} collectivités correspondent`}{' '}
              à votre recherche
            </p>
          )}
          {getNumberOfActiveFilters(filters) > 0 && (
            <DesactiverLesFiltres onClick={() => setFilters(initialFilters)} />
          )}
        </div>
        <TrierParFiltre
          onChange={selected =>
            setFilters({
              ...filters,
              trierPar: selected ? [selected] : undefined,
            })
          }
          selected={filters.trierPar?.[0]}
        />
      </div>
      <CollectivitesGrid
        isLoading={isLoading}
        isCardClickable={canUserClickCard}
        collectivites={data}
        collectivitesCount={dataCount}
        filters={filters}
      />
      {dataCount !== 0 && (
        <div className="flex justify-center mt-6 md:mt-12">
          <Pagination
            nbOfPages={Math.ceil(dataCount / NB_CARDS_PER_PAGE)}
            selectedPage={filters.page ?? 1}
            onChange={selected => setFilters({...filters, page: selected})}
          />
        </div>
      )}
    </div>
  );
};

export default CollectivitesView;
