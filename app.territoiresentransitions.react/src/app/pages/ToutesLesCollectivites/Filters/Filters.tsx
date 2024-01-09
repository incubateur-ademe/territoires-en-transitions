import {useState} from 'react';
import classNames from 'classnames';

import {FiltresColonne} from '../anciensComponents/FiltresColonne';

import {TSetFilters, getNumberOfActiveFilters} from '../data/filters';
import {TCollectivitesFilters} from '../data/filtreLibelles';
import {useDepartements} from '../data/useDepartements';
import {useRegions} from '../data/useRegions';

type Props = {
  filters: TCollectivitesFilters;
  setFilters: TSetFilters;
};

const Filters = ({filters, setFilters}: Props) => {
  const {regions} = useRegions();
  const {departements} = useDepartements();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const numberOfActiveFilters = getNumberOfActiveFilters(filters);

  return (
    <>
      <div
        className={classNames(
          'flex flex-col shrink-0 bg-white z-20 md:mr-6 md:!block md:w-4/12 xl:w-3/12 xl:mr-14',
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
          filters={filters}
          setFilters={setFilters}
          regions={regions}
          departments={departements}
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
      <div className="fixed bottom-0 inset-x-0 z-10 md:hidden">
        <button
          className={`fr-btn justify-center !py-6 text-center ${
            numberOfActiveFilters > 0
              ? 'fr-fi-filter-fill'
              : 'fr-fi-filter-line'
          } fr-fi--sm min-w-full text-center`}
          onClick={() => setIsMobileFilterOpen(true)}
        >
          {numberOfActiveFilters > 0
            ? `Filtrer (${numberOfActiveFilters})`
            : 'Filtrer'}
        </button>
      </div>
    </>
  );
};

export default Filters;
