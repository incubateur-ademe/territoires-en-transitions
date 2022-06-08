import {ITEM_ALL, MultiSelectFilter} from 'ui/shared/MultiSelectFilter';
import {TFiltreProps} from './filters';

export const PHASE = 'phase';

export const phaseItems = [
  {value: ITEM_ALL, label: 'Toutes les phases'},
  {value: 'bases', label: 'S’engager (base, diagnostic)'},
  {value: 'mise en œuvre', label: 'Concrétiser (mise en oeuvre)'},
  {value: 'effets', label: 'Consolider (effet, résultat)'},
];

/**
 * Affiche le filtre par phase
 */
export const FiltrePhase = (props: TFiltreProps) => {
  const {className, filters, setFilters} = props;

  return (
    <MultiSelectFilter
      className={`filtre-phase ${className || ''}`}
      label="Phase"
      values={filters[PHASE]}
      items={phaseItems}
      onChange={newValues => setFilters({...filters, [PHASE]: newValues})}
    />
  );
};
