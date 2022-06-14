import {MultiSelectFilter, ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {TFiltreProps} from './filters';
import {ITEMS} from './SelectStatut';
import './statuts.css';

const items = [{value: ITEM_ALL, label: 'Tous les statuts'}, ...ITEMS];
const FILTER_NAME = 'statut';

/**
 * Affiche le filtre par statuts
 */
export const FiltreStatut = (props: TFiltreProps) => {
  const {className, filters, setFilters} = props;

  return (
    <MultiSelectFilter
      className={`filtre-statut ${className || ''}`}
      label="Statut"
      values={filters[FILTER_NAME]}
      items={items}
      onChange={values => setFilters({...filters, [FILTER_NAME]: values})}
    />
  );
};
