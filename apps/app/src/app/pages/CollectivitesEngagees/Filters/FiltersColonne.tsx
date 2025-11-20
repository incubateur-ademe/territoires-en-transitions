import classNames from 'classnames';
import { useState } from 'react';

import { Filters } from './Filters';

import { RecherchesViewParam } from '@/app/app/paths';
import { CollectiviteEngagee } from '@tet/api';
import { Button } from '@tet/ui';
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
          `
          flex flex-col shrink-0
          bg-white md:rounded-xl
          max-md:fixed md:!block
          md:h-min w-full md:w-5/12 xl:w-3/12
          p-4 pb-6 md:py-10 md:px-8
          max-md:inset-0 max-md:overflow-y-auto max-md:z-[500]
          `,
          {
            hidden: !isMobileFilterOpen,
          }
        )}
      >
        {/* Close filters on mobile */}
        <div
          className={classNames('md:hidden', { hidden: !isMobileFilterOpen })}
        >
          <Button
            onClick={() => setIsMobileFilterOpen(false)}
            className="ml-auto mb-8"
            icon="close-line"
            iconPosition="right"
            variant="outlined"
            size="sm"
          />
          <h4>Filtrer</h4>
        </div>

        {/* Filtres */}
        <Filters vue={vue} filters={filters} setFilters={setFilters} />

        {/* Display results button on mobile */}
        <Button
          className={classNames('mt-8 mx-auto md:hidden', {
            hidden: !isMobileFilterOpen,
          })}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          Afficher les résultats
        </Button>
      </div>

      {/* Trigger filters on mobile */}
      {!isMobileFilterOpen && (
        <div className="fixed bottom-0 inset-x-0 z-[1000] w-screen md:hidden">
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
