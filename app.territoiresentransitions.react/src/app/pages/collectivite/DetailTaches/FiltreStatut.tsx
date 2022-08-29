import {ActionAvancement} from 'generated/dataLayer/action_statut_read';
import ActionStatutBadge from 'ui/shared/actions/ActionStatutBadge';
import {
  MultiSelectFilter,
  getIsAllSelected,
} from 'ui/shared/select/MultiSelectFilter';
import {ITEM_ALL} from 'ui/shared/select/commons';
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

  const isAllSelected = getIsAllSelected(filters[FILTER_NAME]);
  const icon = isAllSelected ? 'fr-fi-filter-line' : 'fr-fi-filter-fill';

  return (
    <MultiSelectFilter
      values={filters[FILTER_NAME]}
      options={items}
      onChange={newValues => setFilters({...filters, [FILTER_NAME]: newValues})}
      customOpenButton={
        <span
          className={`${icon} fr-fi--sm w-full text-center text-bf500 font-bold`}
        >
          &nbsp;Statut
        </span>
      }
      customOption={option =>
        option === 'tous' ? (
          <span className="leading-6">Tous les statuts</span>
        ) : (
          <ActionStatutBadge
            statut={option as ActionAvancement}
            small
            className="my-0.5"
          />
        )
      }
    />
  );
};
