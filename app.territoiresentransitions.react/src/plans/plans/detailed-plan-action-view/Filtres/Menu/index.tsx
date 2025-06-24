import FiltrePersonnes from './Personnes';
import FiltrePriorites from './Priorites';
import FiltreStatuts from './Statuts';

import { usePlanActionFilters } from '../context/PlanActionFiltersContext';

export const Menu = () => {
  const { filters, setFilters } = usePlanActionFilters();

  return (
    <div className="flex flex-col gap-4">
      <FiltrePersonnes
        label="Personne pilote"
        filterKey="pilotes"
        filters={filters}
        setFilters={setFilters}
      />
      <FiltreStatuts filters={filters} setFilters={setFilters} />
      <FiltrePersonnes
        label="Élu·e référent·e"
        filterKey="referents"
        setFilters={setFilters}
        filters={filters}
      />
      <FiltrePriorites filters={filters} setFilters={setFilters} />
    </div>
  );
};
