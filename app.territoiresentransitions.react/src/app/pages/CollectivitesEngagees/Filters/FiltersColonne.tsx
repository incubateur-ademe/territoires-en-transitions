import {useState} from 'react';
import classNames from 'classnames';

import {Filters} from './Filters';

import {Button} from '@tet/ui';
import {CollectiviteEngagee} from '@tet/api';
import {SetFilters, getNumberOfActiveFilters} from '../data/filters';
import {RecherchesViewParam} from 'app/paths';

type Props = {
  vue: RecherchesViewParam;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
};

const FiltersColonne = ({vue, filters, setFilters}: Props) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const numberOfActiveFilters = getNumberOfActiveFilters(filters);

  return (
    <>
      <div
        className={classNames(
          'flex flex-col shrink-0 h-min bg-white md:py-10 md:px-8 md:rounded-xl md:!block md:w-5/12 lg:w-4/12 xl:w-3/12 z-[501]',
          {
            hidden: !isMobileFilterOpen,
            'fixed inset-0 h-screen p-4 pb-6 overflow-y-auto':
              isMobileFilterOpen,
          }
        )}
      >
        {isMobileFilterOpen && (
          <>
            {/* Close filters on mobile */}
            <Button
              onClick={() => setIsMobileFilterOpen(false)}
              className="ml-auto mb-8"
              icon="close-line"
              iconPosition="right"
              variant="outlined"
              size="sm"
            />
            <h4>Filtrer</h4>
          </>
        )}
        <Filters vue={vue} filters={filters} setFilters={setFilters} />
        {isMobileFilterOpen && (
          /* Display results button on mobile */
          <Button
            className="mt-8 mx-auto"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            Afficher les résultats
          </Button>
        )}
      </div>
      {/* Trigger filters on mobile */}
      {!isMobileFilterOpen && (
        <div className="fixed bottom-0 inset-x-0 z-[1000] md:hidden">
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
