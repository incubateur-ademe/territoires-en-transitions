import {useEffect, useState} from 'react';

import FiltrePersonnesPilotes from './FiltrePersonnesPilotes';
import FiltrePriorites from './FiltrePriorites';
import FiltreReferents from './FiltreReferents';
import FiltreStatuts from './FiltreStatuts';
import {DesactiverLesFiltres} from 'ui/shared/filters/DesactiverLesFiltres';

import {TFilters} from '../../FicheAction/data/filters';
import {Accordion} from 'ui/Accordion';

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

  // On prend à partir de 2 éléments car les filtres "collectivite_id" et "plan/axe id" sont des constantes
  const isFiltered = Object.keys(filters).length > 2;

  useEffect(() => {
    if (isFiltered) {
      setIsFiltersOpen(true);
    }
  }, []);

  return (
    <>
      <Accordion
        id="filtres-plan"
        className="mb-8"
        titre="Filtrer"
        html={
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            <FiltrePersonnesPilotes filters={filters} setFilters={setFilters} />
            <FiltreStatuts filters={filters} setFilters={setFilters} />
            <FiltreReferents filters={filters} setFilters={setFilters} />
            <FiltrePriorites filters={filters} setFilters={setFilters} />
          </div>
        }
        initialState={isFiltersOpen}
      />
      {isFiltered && (
        <div className="flex items-baseline gap-6 my-8">
          <span className="text-sm text-gray-400">
            {itemsNumber} résultat{itemsNumber > 1 && 's'}
          </span>
          <DesactiverLesFiltres onClick={() => setFilters(initialFilters)} />
        </div>
      )}
    </>
  );
};

export default PlanActionFiltres;
