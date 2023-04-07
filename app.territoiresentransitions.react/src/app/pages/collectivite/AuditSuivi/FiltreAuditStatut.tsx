import {
  MultiSelectFilter,
  MultiSelectFilterTitle,
} from 'ui/shared/select/MultiSelectFilter';
import {TFiltreProps} from './filters';
import {BadgeAuditStatut} from 'app/pages/collectivite/Audit/BadgeAuditStatut';
import {TAuditStatut} from 'app/pages/collectivite/Audit/types';
import {ITEM_ALL} from 'ui/shared/filters/commons';

export const FILTER = 'statut';

export const filterItems = [
  {value: ITEM_ALL, label: ''},
  {value: 'non_audite', label: ''},
  {value: 'en_cours', label: ''},
  {value: 'audite', label: ''},
];

/**
 * Affiche le filtre par statut d'audit
 */
export const FiltreAuditStatut = (props: TFiltreProps) => {
  const {filters, setFilters} = props;

  return (
    <MultiSelectFilter
      renderSelection={values => (
        <MultiSelectFilterTitle values={values} label="Avancement audit" />
      )}
      values={filters[FILTER]}
      options={filterItems}
      onSelect={newValues => setFilters({...filters, [FILTER]: newValues})}
      renderOption={option =>
        option.value === ITEM_ALL ? (
          <span className="pr-4 py-1 fr-text-mention--grey">Tous</span>
        ) : (
          <BadgeAuditStatut statut={option.value as TAuditStatut} />
        )
      }
    />
  );
};
