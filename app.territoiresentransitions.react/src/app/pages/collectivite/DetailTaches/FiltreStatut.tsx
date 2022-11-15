import classNames from 'classnames';
import {ITEM_ALL} from 'ui/shared/select/commons';
import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {TFiltreProps} from './filters';
import {ITEMS} from './SelectStatut';
import './statuts.css';

const items = [{value: ITEM_ALL, label: 'Tous les statuts'}, ...ITEMS];
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
        <span
          className={classNames(
            'fr-fi--sm w-full text-center text-bf500 font-bold',
            {'fr-fi-filter-fill': values.includes(ITEM_ALL)},
            {'fr-fi-filter-line': !values.includes(ITEM_ALL)}
          )}
        >
          &nbsp;Statut
        </span>
      )}
    />
  );
};
