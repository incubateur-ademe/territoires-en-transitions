import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from 'ui/shared/select/MultiSelectFilter';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';

import {ITEM_ALL} from 'ui/shared/filters/commons';
import {TFiltreProps} from './filters';
import {TActionAvancementExt} from 'types/alias';
import {DEFAULT_OPTIONS} from 'ui/shared/actions/SelectActionStatut';

// les options sont celles du sélecteur de statut + une entrée "tous les statuts"
const items = [
  {value: ITEM_ALL, label: 'Tous les statuts'},
  ...DEFAULT_OPTIONS,
];
const FILTER_NAME = 'statut';

/**
 * Affiche le filtre par statuts
 */
export const FiltreStatut = (props: TFiltreProps) => {
  const {filters, setFilters} = props;

  return (
    <MultiSelectFilter
      values={filters[FILTER_NAME]}
      options={items}
      onSelect={values => setFilters({...filters, [FILTER_NAME]: values})}
      renderSelection={values => (
        <MultiSelectFilterTitle values={values} label="Statut" />
      )}
      renderOption={option =>
        option.value === ITEM_ALL ? (
          <span className="leading-6">Tous les statuts</span>
        ) : (
          <ActionStatutBadge statut={option.value as TActionAvancementExt} />
        )
      }
    />
  );
};
