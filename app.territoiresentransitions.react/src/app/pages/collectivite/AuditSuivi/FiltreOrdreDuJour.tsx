import {ITEM_ALL, MultiSelectFilter} from 'ui/shared/MultiSelectFilter';
import {TFiltreProps} from './filters';

export const FILTER = 'ordre_du_jour';

export const filterItems = [
  {value: ITEM_ALL, label: 'Tous'},
  {value: 'true', label: 'Oui'},
  {value: 'false', label: 'Non'},
];

/**
 * Affiche le filtre par inscription à la prochaine séance d'audit
 */
export const FiltreOrdreDuJour = (props: TFiltreProps) => {
  const {className, filters, setFilters} = props;

  return (
    <MultiSelectFilter
      className={`filtre-odj ${className || ''}`}
      label="A discuter - Séance d'audit"
      values={filters[FILTER]}
      items={filterItems}
      onChange={newValues => setFilters({...filters, [FILTER]: newValues})}
    />
  );
};
