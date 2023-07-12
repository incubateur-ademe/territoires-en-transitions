import {FiltersKeys} from '../../FicheAction/data/filters';
import {TFichesActionsListe} from '../../FicheAction/data/useFichesActionFiltresListe';
import FiltreEcheance from '../../PlanAction/PlanActionFiltres/FiltreEcheance';
import FiltrePersonnes from '../../PlanAction/PlanActionFiltres/FiltrePersonnes';
import FiltrePriorites from '../../PlanAction/PlanActionFiltres/FiltrePriorites';
import FiltreStatuts from '../../PlanAction/PlanActionFiltres/FiltreStatuts';

type Props = {
  filtresSecondaires: FiltersKeys[];
  filters: TFichesActionsListe;
};

const FiltresSecondaires = ({filtresSecondaires, filters}: Props) => {
  return (
    <>
      {filtresSecondaires.map(
        filtre =>
          (filtre === 'pilotes' && (
            <FiltrePersonnes
              key={filtre}
              dataTest="filtre-personne-pilote"
              label="Personne pilote"
              filterKey="pilotes"
              filters={filters.filters}
              setFilters={filters.setFilters}
            />
          )) ||
          (filtre === 'referents' && (
            <FiltrePersonnes
              key={filtre}
              dataTest="filtre-personne-referentes"
              label="Élu·e référent·e"
              filterKey="referents"
              filters={filters.filters}
              setFilters={filters.setFilters}
            />
          )) ||
          (filtre === 'priorites' && (
            <FiltrePriorites
              key={filtre}
              filters={filters.filters}
              setFilters={filters.setFilters}
            />
          )) ||
          (filtre === 'statuts' && (
            <FiltreStatuts
              key={filtre}
              filters={filters.filters}
              setFilters={filters.setFilters}
            />
          )) ||
          (filtre === 'echeance' && (
            <FiltreEcheance
              key={filtre}
              filters={filters.filters}
              setFilters={filters.setFilters}
            />
          ))
      )}
    </>
  );
};

export default FiltresSecondaires;
