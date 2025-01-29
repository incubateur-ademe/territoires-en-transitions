import { ITEM_ALL } from '@/app/ui/shared/filters/commons';
import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from '@/app/ui/shared/select/MultiSelectFilter';
import { TFiltreProps } from './filters';

export const FILTER = 'ordre_du_jour';

export const filterItems = [
  { value: ITEM_ALL, label: 'Tous' },
  { value: 'true', label: 'Oui' },
  { value: 'false', label: 'Non' },
];

/**
 * Affiche le filtre par inscription à la prochaine séance d'audit
 */
export const FiltreOrdreDuJour = (props: TFiltreProps) => {
  const { filters, setFilters } = props;

  return (
    <MultiSelectFilter
      renderSelection={(values) => (
        <MultiSelectFilterTitle
          values={values}
          label="A discuter - Séance d'audit"
        />
      )}
      values={filters[FILTER]}
      options={filterItems}
      onSelect={(newValues) => setFilters({ ...filters, [FILTER]: newValues })}
    />
  );
};
