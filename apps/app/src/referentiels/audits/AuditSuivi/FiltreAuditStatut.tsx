import { BadgeAuditStatut } from '@/app/referentiels/audits/BadgeAuditStatut';
import { TAuditStatut } from '@/app/referentiels/audits/types';
import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from '@/app/ui/shared/select/MultiSelectFilter';
import { ITEM_ALL } from '@/ui';
import { TFiltreProps } from './filters';

export const FILTER = 'statut';

export const filterItems = [
  { value: ITEM_ALL, label: '' },
  { value: 'non_audite', label: '' },
  { value: 'en_cours', label: '' },
  { value: 'audite', label: '' },
];

/**
 * Affiche le filtre par statut d'audit
 */
export const FiltreAuditStatut = (props: TFiltreProps) => {
  const { filters, setFilters } = props;

  return (
    <MultiSelectFilter
      renderSelection={(values) => (
        <MultiSelectFilterTitle values={values} label="Avancement audit" />
      )}
      values={filters[FILTER]}
      options={filterItems}
      onSelect={(newValues) => setFilters({ ...filters, [FILTER]: newValues })}
      renderOption={(option) =>
        option.value === ITEM_ALL ? (
          <span className="pr-4 py-1">Tous</span>
        ) : (
          <BadgeAuditStatut statut={option.value as TAuditStatut} />
        )
      }
    />
  );
};
