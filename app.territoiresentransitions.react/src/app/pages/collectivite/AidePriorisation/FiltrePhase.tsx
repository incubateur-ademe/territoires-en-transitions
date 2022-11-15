import classNames from 'classnames';
import {ITEM_ALL} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
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
        <span
          className={classNames(
            'fr-fi--sm w-full text-center text-bf500 font-bold',
            {'fr-fi-filter-fill': values.includes(ITEM_ALL)},
            {'fr-fi-filter-line': !values.includes(ITEM_ALL)}
          )}
        >
          &nbsp;Phase
        </span>
      )}
    />
  );
};
