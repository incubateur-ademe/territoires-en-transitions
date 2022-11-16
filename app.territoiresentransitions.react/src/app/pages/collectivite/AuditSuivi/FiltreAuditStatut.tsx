import {MultiSelectFilter} from 'ui/shared/select/MultiSelectFilter';
import {ITEM_ALL} from 'ui/shared/select/commons';
import {TFiltreProps} from './filters';
import {BadgeAuditStatut} from 'app/pages/collectivite/Audit/BadgeAuditStatut';
import {TAuditStatut} from 'app/pages/collectivite/Audit/types';
import {MultiSelectFilterTitle} from 'ui/shared/select/MultiSelectFilterTitle';

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
      renderOption={(value: string) =>
        value === ITEM_ALL ? (
          <span className="pr-4 py-1 fr-text-mention--grey">Tous</span>
        ) : (
          <BadgeAuditStatut statut={value as TAuditStatut} />
        )
      }
    />
  );
};
