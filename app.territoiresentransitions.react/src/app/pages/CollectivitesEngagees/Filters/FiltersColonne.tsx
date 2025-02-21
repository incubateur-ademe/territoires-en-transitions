import classNames from 'classnames';
import { useState } from 'react';

import { Filters } from './Filters';

import { CollectiviteEngagee } from '@/api';
import { RecherchesViewParam } from '@/app/app/paths';
import { Button } from '@/ui';
import { SetFilters, getNumberOfActiveFilters } from '../data/filters';

type Props = {
  vue: RecherchesViewParam;
  filters: CollectiviteEngagee.Filters;
  setFilters: SetFilters;
};

const FiltersColonne = ({ vue, filters, setFilters }: Props) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const numberOfActiveFilters = getNumberOfActiveFilters(filters);

  return (
    <>
      <div
        className={classNames(
          'flex flex-col shrink-0 h-min bg-white md:py-10 md:px-8 md:rounded-xl md:!block md:w-5/12 lg:w-4/12 xl:w-3/12',
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
          <Button
            className="w-full justify-center rounded-none"
            icon={numberOfActiveFilters > 0 ? 'filter-fill' : 'filter-line'}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            {numberOfActiveFilters > 0
              ? `Filtrer (${numberOfActiveFilters})`
              : 'Filtrer'}
          </Button>
        </div>
      )}
    </>
  );
};

export default FiltersColonne;
