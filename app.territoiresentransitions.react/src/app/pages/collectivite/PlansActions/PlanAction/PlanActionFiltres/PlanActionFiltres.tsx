import {useEffect, useState} from 'react';

import FiltrePersonnesPilotes from './FiltrePersonnesPilotes';
import FiltrePriorites from './FiltrePriorites';
import FiltreReferents from './FiltreReferents';
import FiltreStatuts from './FiltreStatuts';
import {DesactiverLesFiltres} from 'ui/shared/filters/DesactiverLesFiltres';

import {TFilters} from '../../FicheAction/data/filters';
import {Accordion} from 'ui/Accordion';
import {FicheAction} from '../../FicheAction/data/types';
import FicheActionCard from '../../FicheAction/FicheActionCard';
import {makeCollectivitePlanActionFicheUrl} from 'app/paths';
import {useCollectiviteId} from 'core-logic/hooks/params';

type Props = {
  planId: string;
  itemsNumber: number;
  initialFilters: TFilters;
  filters: TFilters;
  setFilters: (filters: TFilters) => void;
  fichesActionsListe: FicheAction[];
  isFiltered: boolean;
};

const PlanActionFiltres = ({
  planId,
  itemsNumber,
  initialFilters,
  filters,
  setFilters,
  fichesActionsListe,
  isFiltered,
}: Props) => {
  const collectivite_id = useCollectiviteId();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  useEffect(() => {
    if (isFiltered) {
      setIsFiltersOpen(true);
    }
  }, []);

  return (
    <div>
      <Accordion
        dataTest="FiltrerFiches"
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
        <>
          <div className="flex items-baseline gap-6 my-8">
            <span className="text-sm text-gray-400">
              {itemsNumber} résultat{itemsNumber > 1 && 's'}
            </span>
            <DesactiverLesFiltres onClick={() => setFilters(initialFilters)} />
          </div>
          {fichesActionsListe.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {fichesActionsListe.map(fiche => (
                <FicheActionCard
                  key={fiche.id}
                  ficheAction={fiche}
                  link={makeCollectivitePlanActionFicheUrl({
                    collectiviteId: collectivite_id!,
                    planActionUid: planId,
                    ficheUid: fiche.id!.toString(),
                  })}
                />
              ))}
            </div>
          ) : (
            <div className="mt-16 mb-8">
              Aucune fiche ne correspond à votre recherche
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PlanActionFiltres;
