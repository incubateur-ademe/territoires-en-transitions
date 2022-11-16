import {ITEM_ALL} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {MultiSelectFilterTitle} from 'ui/shared/select/MultiSelectFilterTitle';
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
  const {filters, setFilters} = props;

  return (
    <MultiSelectFilter
      values={filters[PHASE]}
      options={phaseItems}
      onSelect={newValues => setFilters({...filters, [PHASE]: newValues})}
      renderSelection={values => (
        <MultiSelectFilterTitle values={values} label="Phase" />
      )}
    />
  );
};
