import {DesactiverLesFiltres} from 'app/pages/ToutesLesCollectivites/components/DesactiverLesFiltres';
import FiltreMembre from './FiltreMembre';
import FiltreType from './FiltreType';

import {TFilters, TInitialFilters} from '../filters';
import {FiltreDateDebut, FiltreDateFin} from './FiltreDate';

export type HistoriqueFiltresProps = {
  itemsNumber: number;
  initialFilters: TInitialFilters;
  filters: TFilters;
  setFilters: (filters: TFilters) => void;
};

const HistoriqueFiltres = ({
  itemsNumber,
  initialFilters,
  filters,
  setFilters,
}: HistoriqueFiltresProps) => {
  return (
    <div className="mb-8 pb-8 border-b border-b-gray-200">
      <p className="mb-6 font-bold">
        Filtrer l’historique des modifications par
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
        <FiltreMembre filters={filters} setFilters={setFilters} />
        <FiltreType filters={filters} setFilters={setFilters} />
        <FiltreDateDebut filters={filters} setFilters={setFilters} />
        <FiltreDateFin filters={filters} setFilters={setFilters} />
      </div>
      {Object.keys(filters).length > 2 && (
        <div className="flex items-baseline gap-6 mt-8">
          <span className="text-sm text-gray-400">
            {itemsNumber} résultat{itemsNumber > 1 && 's'}
          </span>
          <DesactiverLesFiltres onClick={() => setFilters(initialFilters)} />
        </div>
      )}
    </div>
  );
};

export default HistoriqueFiltres;
