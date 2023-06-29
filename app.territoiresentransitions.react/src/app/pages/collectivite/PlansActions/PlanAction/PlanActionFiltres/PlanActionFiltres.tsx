import FiltrePersonnes from './FiltrePersonnes';
import FiltrePriorites from './FiltrePriorites';
import FiltreStatuts from './FiltreStatuts';
import PlanActionFiltresResultats from './PlanActionFiltresResultats';

import {useFichesActionFiltresListe} from '../../FicheAction/data/useFichesActionFiltresListe';
import {PlanNode} from '../data/types';
import {useEffect, useState} from 'react';
import {TFilters} from '../../FicheAction/data/filters';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Props = {
  plan: PlanNode;
  axe?: PlanNode;
  setIsFiltered: (filtered: boolean) => void;
};

const PlanActionFiltres = ({plan, axe, setIsFiltered}: Props) => {
  const collectivite_id = useCollectiviteId();

  const [filtered, setFiltered] = useState(false);

  const initialFilters: TFilters = {
    collectivite_id: collectivite_id!,
    axes: [axe ? axe.id : plan.id],
  };

  const filters = useFichesActionFiltresListe({
    url: axe
      ? `/collectivite/${collectivite_id}/plans/plan/${plan.id}/${axe.id}`
      : `/collectivite/${collectivite_id}/plans/plan/${plan.id}`,
    initialFilters,
  });

  // On prend à partir de 2 éléments car les filtres "collectivite_id" et "plan/axe id" sont des constantes
  // Et on le passe au parent pour afficher le plan ou les filtres
  useEffect(() => {
    const isFiltered =
      (filters.filters && Object.keys(filters.filters).length > 2) || false;
    setFiltered(isFiltered);
    setIsFiltered(isFiltered);
  }, [filters.filters]);

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
        <FiltrePersonnes
          dataTest="filtre-personne-pilote"
          label="Personne pilote"
          filterKey="pilotes"
          filters={filters.filters}
          setFilters={filters.setFilters}
        />
        <FiltreStatuts
          filters={filters.filters}
          setFilters={filters.setFilters}
        />
        <FiltrePersonnes
          dataTest="filtre-referent"
          label="Élu·e référent·e"
          filterKey="referents"
          setFilters={filters.setFilters}
          filters={filters.filters}
        />
        <FiltrePriorites
          filters={filters.filters}
          setFilters={filters.setFilters}
        />
      </div>
      {filtered && (
        <PlanActionFiltresResultats
          planId={plan.id.toString()}
          filters={filters}
        />
      )}
    </>
  );
};

export default PlanActionFiltres;
