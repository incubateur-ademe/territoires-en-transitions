import FiltreMembre from './FiltreMembre';
import FiltreType from './FiltreType';

import { DeleteFiltersButton } from '@/app/ui/lists/DEPRECATED_filter-badges/delete-filters.button';
import { TFilters } from '../filters';
import { FiltreDateDebut, FiltreDateFin } from './FiltreDate';

export type HistoriqueFiltresProps = {
  itemsNumber: number;
  filters: TFilters;
  setFilters: (filters: TFilters | null) => void;
};

const HistoriqueFiltres = ({
  itemsNumber,
  filters,
  setFilters,
}: HistoriqueFiltresProps) => {
  return (
    <div
      id="filtres-historique"
      className="mb-8 pb-8 border-b border-b-gray-200"
    >
      <p className="mb-6 font-bold">
        Filtrer l’historique des modifications par
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        <FiltreMembre filters={filters} setFilters={setFilters} />
        <FiltreType filters={filters} setFilters={setFilters} />
        <FiltreDateDebut filters={filters} setFilters={setFilters} />
        <FiltreDateFin filters={filters} setFilters={setFilters} />
      </div>
      {Object.values(filters).some((value) => value !== null) && (
        <div className="flex items-baseline gap-6 mt-8">
          <span className="text-sm text-gray-400">
            {itemsNumber} résultat{itemsNumber > 1 && 's'}
          </span>
          <DeleteFiltersButton onClick={() => setFilters(null)} />
        </div>
      )}
    </div>
  );
};

export default HistoriqueFiltres;
