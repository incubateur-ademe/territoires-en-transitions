import {ITEM_ALL, MultiSelectFilter} from 'ui/shared/MultiSelectFilter';
import {TFiltreProps} from './filters';
import {BadgeAuditStatut} from 'app/pages/collectivite/Audit/BadgeAuditStatut';
import {TAuditStatut} from 'app/pages/collectivite/Audit/types';

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
  const {className, filters, setFilters} = props;

  return (
    <MultiSelectFilter
      className={`filtre-statut ${className || ''}`}
      label="Avancement audit"
      values={filters[FILTER]}
      items={filterItems}
      onChange={newValues => setFilters({...filters, [FILTER]: newValues})}
      renderValue={(value: string) =>
        value === ITEM_ALL ? (
          <span className="pr-4 py-1 fr-text-mention--grey">Tous</span>
        ) : (
          <BadgeAuditStatut statut={value as TAuditStatut} />
        )
      }
    />
  );
};
