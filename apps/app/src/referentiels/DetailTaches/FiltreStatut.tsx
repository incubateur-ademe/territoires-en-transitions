import ActionStatutBadge from '@/app/referentiels/actions/action-statut/action-statut.badge';
import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from '@/app/ui/shared/select/MultiSelectFilter';

import { DEFAULT_OPTIONS_WITH_NON_CONCERNE } from '@/app/referentiels/actions/action-statut/action-statut.select';
import { StatutAvancementIncludingNonConcerne } from '@/domain/referentiels';
import { ITEM_ALL } from '@/ui';
import { TFiltreProps } from './filters';

// les options sont celles du sélecteur de statut + une entrée "tous les statuts"
const items = [
  { value: ITEM_ALL, label: 'Tous les statuts' },
  ...DEFAULT_OPTIONS_WITH_NON_CONCERNE,
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
          <ActionStatutBadge
            statut={option.value as StatutAvancementIncludingNonConcerne}
          />
        )
      }
    />
  );
};
