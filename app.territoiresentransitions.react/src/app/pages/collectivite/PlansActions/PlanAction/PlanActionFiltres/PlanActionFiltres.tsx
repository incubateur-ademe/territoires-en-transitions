import {useState} from 'react';

import FiltrePersonnesPilotes from './FiltrePersonnesPilotes';
import FiltrePriorites from './FiltrePriorites';
import FiltreReferents from './FiltreReferents';
import FiltreStatuts from './FiltreStatuts';
import {DesactiverLesFiltres} from 'ui/shared/filters/DesactiverLesFiltres';

import {TFilters} from '../../FicheAction/data/filters';

type Props = {
  itemsNumber: number;
  initialFilters: TFilters;
  filters: TFilters;
  setFilters: (filters: TFilters) => void;
};

const PlanActionFiltres = ({
  itemsNumber,
  initialFilters,
  filters,
  setFilters,
}: Props) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  return (
    <div className="mb-8">
      <div className="border-y border-gray-200">
        <button
          className="flex items-center justify-between py-3 px-4 w-full"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <span className="font-bold">Filtrer les fiches</span>
          <span className="mb-1">{isFiltersOpen ? '-' : '+'}</span>
        </button>
      </div>
      {isFiltersOpen && (
        <div className="mt-6 grid sm:grid-cols-2 gap-x-8 gap-y-6">
          <FiltrePersonnesPilotes filters={filters} setFilters={setFilters} />
          <FiltreStatuts filters={filters} setFilters={setFilters} />
          <FiltreReferents filters={filters} setFilters={setFilters} />
          <FiltrePriorites filters={filters} setFilters={setFilters} />
        </div>
      )}
      {Object.keys(filters).length > 2 && (
        <div className="flex items-baseline gap-6 mt-8 pb-6 border-b border-gray-200">
          <span className="text-sm text-gray-400">
            {itemsNumber} résultat{itemsNumber > 1 && 's'}
          </span>
          <DesactiverLesFiltres onClick={() => setFilters(initialFilters)} />
        </div>
      )}
    </div>
  );
};

export default PlanActionFiltres;
