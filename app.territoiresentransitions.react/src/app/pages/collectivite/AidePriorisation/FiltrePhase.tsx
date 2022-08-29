import {TFiltreProps} from './filters';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {getIsAllSelected, ITEM_ALL} from 'ui/shared/select/commons';

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

  const isAllSelected = getIsAllSelected(filters[PHASE]);
  const icon = isAllSelected ? 'fr-fi-filter-line' : 'fr-fi-filter-fill';

  return (
    <MultiSelectFilter
      values={filters[PHASE]}
      options={phaseItems}
      onChange={newValues => setFilters({...filters, [PHASE]: newValues})}
      customOpenButton={
        <span
          className={`${icon} fr-fi--sm w-full text-center text-bf500 font-bold`}
        >
          &nbsp;Phase
        </span>
      }
    />
  );
};
