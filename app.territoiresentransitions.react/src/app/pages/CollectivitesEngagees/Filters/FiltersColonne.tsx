import {useState} from 'react';
import classNames from 'classnames';

import {Filters} from './Filters';

import {Tfilters, TSetFilters, getNumberOfActiveFilters} from '../data/filters';

type Props = {
  filters: Tfilters;
  setFilters: TSetFilters;
};

const FiltersColonne = ({filters, setFilters}: Props) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const numberOfActiveFilters = getNumberOfActiveFilters(filters);

  return (
    <>
      <div
        className={classNames(
          'flex flex-col shrink-0 h-min bg-white md:py-10 md:px-8 md:rounded-xl md:!block md:w-5/12 lg:w-4/12 xl:w-3/12',
          {
            hidden: !isMobileFilterOpen,
            'fixed inset-0 top-44 p-4 pb-6 overflow-y-auto': isMobileFilterOpen,
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
        <Filters filters={filters} setFilters={setFilters} />
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
      {!isMobileFilterOpen && (
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
      )}
    </>
  );
};

export default FiltersColonne;
