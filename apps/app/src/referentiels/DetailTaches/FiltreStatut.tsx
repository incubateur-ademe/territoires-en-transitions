import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from '@/app/ui/shared/select/MultiSelectFilter';

import { StatutAvancementCreate } from '@tet/domain/referentiels';
import { ITEM_ALL } from '@tet/ui';
import { ACTION_STATUT_SELECT_DEFAULT_OPTIONS } from '../actions/action-statut/action-statut.dropdown';
import { TFiltreProps } from './filters';

// les options sont celles du sélecteur de statut + une entrée "tous les statuts"
const items = [
  { value: ITEM_ALL, label: 'Tous les statuts' },
  ...ACTION_STATUT_SELECT_DEFAULT_OPTIONS,
];
const FILTER_NAME = 'statut';

/**
 * Affiche le filtre par statuts
 */
export const FiltreStatut = (props: TFiltreProps) => {
  const { filters, setFilters } = props;

  return (
    <MultiSelectFilter
      values={filters[FILTER_NAME]}
      options={items}
      onSelect={(values) => setFilters({ ...filters, [FILTER_NAME]: values })}
      renderSelection={(values) => (
        <MultiSelectFilterTitle values={values} label="Statut" />
      )}
      renderOption={(option) =>
        option.value === ITEM_ALL ? (
          <span className="leading-6">Tous les statuts</span>
        ) : (
          <ActionStatutBadge statut={option.value as StatutAvancementCreate} />
        )
      }
    />
  );
};
