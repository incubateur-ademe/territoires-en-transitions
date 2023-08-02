import {FiltersKeys} from '../../../FicheAction/data/filters';
import {TFichesActionsListe} from '../../../FicheAction/data/useFichesActionFiltresListe';
import FiltrePrimaireEcheance from './FiltrePrimaireEcheance';
import FiltrePrimairePersonne from './FiltrePrimairePersonne';
import FiltrePrimairePriorites from './FiltrePrimairePriorites';
import FiltrePrimaireStatuts from './FiltrePrimaireStatuts';

type Props = {
  vue: FiltersKeys;
  filters: TFichesActionsListe;
};

const FiltresPrimaires = ({vue, filters}: Props) => {
  if (vue === 'statuts')
    return <FiltrePrimaireStatuts filtersOptions={filters} />;
  if (vue === 'pilotes' || vue === 'referents')
    return <FiltrePrimairePersonne filterKey={vue} filtersOptions={filters} />;
  if (vue === 'priorites')
    return <FiltrePrimairePriorites filtersOptions={filters} />;
  if (vue === 'echeance')
    return <FiltrePrimaireEcheance filtersOptions={filters} />;
  return null;
};

export default FiltresPrimaires;
