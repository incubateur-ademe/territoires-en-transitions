import FiltrePersonnes from './FiltrePersonnes';
import FiltrePriorites from './FiltrePriorites';
import FiltreStatuts from './FiltreStatuts';
import PlanActionFiltresResultats from './PlanActionFiltresResultats';

import { CollectiviteNiveauAccess } from '@/api/collectivites/fetch-collectivite-niveau-acces';
import { useEffect, useState } from 'react';
import { TFilters } from '../../FicheAction/data/filters';
import { useFichesActionFiltresListe } from '../../FicheAction/data/useFichesActionFiltresListe';
import { PlanNode } from '../data/types';

type Props = {
  plan: PlanNode;
  axe: PlanNode;
  isAxePage: boolean;
  setIsFiltered: (filtered: boolean) => void;
  collectivite: CollectiviteNiveauAccess;
};

export const PlanActionFiltres = ({
  plan,
  axe,
  isAxePage,
  setIsFiltered,
  collectivite,
}: Props) => {
  const [filtered, setFiltered] = useState(false);

  const initialFilters: TFilters = {
    collectivite_id: collectivite.id,
    axes: [axe.id],
  };

  const filters = useFichesActionFiltresListe({
    url: isAxePage
      ? `/collectivite/${collectivite.id}/plans/plan/${plan.id}/${axe.id}`
      : `/collectivite/${collectivite.id}/plans/plan/${plan.id}`,
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
          collectivite={collectivite}
          planId={plan.id.toString()}
          filters={filters}
        />
      )}
    </>
  );
};
